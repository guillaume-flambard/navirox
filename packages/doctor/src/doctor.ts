import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createNodeCommandProbe, type ICommandProbe } from './commands.js'
import {
  checkToolchain,
  createNodeProbe,
  type ICheckResult,
  type IProbe,
  type TPlatform,
} from './toolchain.js'

/**
 * `navirox doctor`: what this machine has, and what this app is built on.
 *
 * The command answers with checks rather than with prose, so the same report can
 * be printed, printed as JSON for CI, or asserted in a test. Every check that is
 * not `ok` carries the fix, and a check that cannot be decided is `unknown`
 * rather than a guess, because a false `ok` here is worse than no answer: it
 * sends a person looking for a bug in their own app.
 *
 * Nothing in this package imports the renderer or the adapter. The toolchain
 * plane is not allowed to reach Symbiote, so what this command knows about the
 * renderer comes from files an app already has on disk, read through the same
 * injected dependency the tests replace.
 */

export type TStatus = 'ok' | 'warn' | 'fail' | 'unknown'

export type TSectionId = 'environment' | 'runtime' | 'compatibility'

export interface IDoctorCheck {
  readonly id: string
  readonly label: string
  readonly status: TStatus
  /** What was found: a version, a path, or why the answer is unknown. */
  readonly detail: string
  /** What to do about it. Empty when there is nothing to do. */
  readonly remedy: string
}

export interface IDoctorSection {
  readonly id: TSectionId
  readonly checks: readonly IDoctorCheck[]
}

export interface IDoctorReport {
  readonly appDirectory: string
  readonly platform: TPlatform
  readonly sections: readonly IDoctorSection[]
  readonly counts: Readonly<Record<TStatus, number>>
}

export interface IRunDoctorOptions {
  /** The app to inspect. */
  readonly directory: string
  /** Which platform's build tools matter here. Defaults to the host's. */
  readonly platform?: TPlatform
}

export interface IDoctorDeps {
  readonly env: NodeJS.ProcessEnv
  readonly probe: IProbe
  readonly command: ICommandProbe
  readonly exists: (path: string) => boolean
  readonly readFile: (path: string) => string
  /** The running Node version, `process.version` in a normal run. */
  readonly nodeVersion: string
}

/** The meta-package the plan forbids, because it fights the Navirox pipeline. */
const FORBIDDEN_PACKAGE = 'expo'

export function createDoctorDeps(): IDoctorDeps {
  return {
    env: process.env,
    probe: createNodeProbe(),
    command: createNodeCommandProbe(),
    exists: (path) => existsSync(path),
    readFile: (path) => readFileSync(path, 'utf8'),
    nodeVersion: process.version,
  }
}

export function runDoctor(
  options: IRunDoctorOptions,
  deps: IDoctorDeps = createDoctorDeps(),
): IDoctorReport {
  const { directory } = options
  const platform = options.platform ?? hostPlatform()

  const sections: readonly IDoctorSection[] = [
    { id: 'environment', checks: environmentChecks(directory, platform, deps) },
    { id: 'runtime', checks: runtimeChecks(directory, deps) },
    { id: 'compatibility', checks: compatibilityChecks(directory, deps) },
  ]

  return {
    appDirectory: directory,
    platform,
    sections,
    counts: countStatuses(sections),
  }
}

/**
 * The exit code is part of the contract, not a convenience: a compatibility
 * failure is the one an app cannot ignore, an environment failure is the one a
 * person fixes on their machine, and a warning never changes the code.
 */
export function exitCodeFor(report: IDoctorReport): number {
  if (failsIn(report, 'compatibility')) {
    return 3
  }
  if (failsIn(report, 'environment')) {
    return 2
  }
  return 0
}

export function hostPlatform(system: NodeJS.Platform = process.platform): TPlatform {
  return system === 'darwin' ? 'ios' : 'android'
}

function failsIn(report: IDoctorReport, section: TSectionId): boolean {
  const found = report.sections.find((candidate) => candidate.id === section)
  return (found?.checks ?? []).some((check) => check.status === 'fail')
}

function countStatuses(sections: readonly IDoctorSection[]): Readonly<Record<TStatus, number>> {
  const counts: Record<TStatus, number> = { ok: 0, warn: 0, fail: 0, unknown: 0 }

  for (const section of sections) {
    for (const check of section.checks) {
      counts[check.status] += 1
    }
  }

  return counts
}

function environmentChecks(
  directory: string,
  platform: TPlatform,
  deps: IDoctorDeps,
): readonly IDoctorCheck[] {
  const checks: IDoctorCheck[] = [nodeCheck(directory, deps), pnpmCheck(directory, deps)]

  // The same table `navirox dev` refuses to start without, reported instead of
  // enforced. One source for the question means the two commands cannot come to
  // different answers about the same machine.
  for (const result of checkToolchain({ platform, env: deps.env, probe: deps.probe })) {
    checks.push(reportToolResult(result))
  }

  if (platform === 'android') {
    checks.push(javaCheck(deps))
  }

  return checks
}

function reportToolResult(result: ICheckResult): IDoctorCheck {
  return {
    id: result.id,
    label: result.label,
    status: result.ok ? 'ok' : 'fail',
    detail: result.detail,
    remedy: result.ok ? '' : result.remedy,
  }
}

function nodeCheck(directory: string, deps: IDoctorDeps): IDoctorCheck {
  const version = stripLeadingVee(deps.nodeVersion)
  const floor = enginesNodeFloor(directory, deps)

  if (floor === undefined) {
    return {
      id: 'node',
      label: 'Node.js',
      status: 'ok',
      detail: `${version}, and this app declares no engines.node floor to compare it against`,
      remedy: '',
    }
  }

  if (compareVersions(version, floor) >= 0) {
    return { id: 'node', label: 'Node.js', status: 'ok', detail: version, remedy: '' }
  }

  return {
    id: 'node',
    label: 'Node.js',
    status: 'fail',
    detail: `${version}, but this app asks for ${floor} or newer`,
    remedy: `Install Node ${floor} or newer, or lower the engines.node floor in this app.`,
  }
}

function pnpmCheck(directory: string, deps: IDoctorDeps): IDoctorCheck {
  const result = deps.command.run('pnpm', ['--version'])

  if (result.status !== 0) {
    return {
      id: 'pnpm',
      label: 'pnpm',
      status: 'fail',
      detail: firstLine(result.stderr),
      remedy:
        'Install pnpm, which Navirox runs the app with. `corepack enable` gives you the pinned version.',
    }
  }

  const version = stripLeadingVee(firstLine(result.stdout))
  const pinned = packageManagerVersion(directory, deps)

  if (pinned === undefined) {
    return {
      id: 'pnpm',
      label: 'pnpm',
      status: 'ok',
      detail: `${version}, and this app pins no package manager to compare it against`,
      remedy: '',
    }
  }

  const running = major(version)
  const expected = major(pinned)

  if (running !== undefined && running === expected) {
    return { id: 'pnpm', label: 'pnpm', status: 'ok', detail: `${version}, as pinned`, remedy: '' }
  }

  return {
    id: 'pnpm',
    label: 'pnpm',
    status: 'warn',
    detail: `${version}, but this app pins ${pinned}`,
    remedy: `Run the pinned pnpm. \`corepack enable\` picks ${pinned} up from the app's packageManager field.`,
  }
}

function javaCheck(deps: IDoctorDeps): IDoctorCheck {
  const result = deps.command.run('java', ['-version'])
  const text = `${result.stderr}\n${result.stdout}`
  const version = quotedVersion(text)

  if (result.status !== 0 || version === undefined) {
    return {
      id: 'java',
      label: 'Java',
      status: 'warn',
      detail: 'java is not on PATH, or did not report a version',
      remedy:
        'Install a JDK, which the Android build needs. Android Studio ships one, or `brew install --cask temurin`.',
    }
  }

  return { id: 'java', label: 'Java', status: 'ok', detail: version, remedy: '' }
}

function runtimeChecks(directory: string, deps: IDoctorDeps): readonly IDoctorCheck[] {
  if (!deps.exists(join(directory, 'node_modules'))) {
    return [
      {
        id: 'node_modules',
        label: 'The installed dependencies',
        status: 'unknown',
        detail: 'there is no node_modules here, so there are no installed versions to read',
        remedy: 'Install this app first, with the package manager it pins.',
      },
    ]
  }

  // The forbidden meta-package is the compatibility section's to report. Listing
  // it here as well would put two checks with the same id in one report, and the
  // installed version of a package an app must not have is not worth a line.
  const declared = declaredPackages(directory, deps).filter((name) => name !== FORBIDDEN_PACKAGE)

  if (declared.length === 0) {
    return [
      {
        id: 'dependencies',
        label: 'The declared dependencies',
        status: 'unknown',
        detail: 'this app declares no dependencies, so there is no version to look up',
        remedy: '',
      },
    ]
  }

  return declared.map((name) => {
    const version = installedVersion(directory, name, deps)

    if (version === undefined) {
      return {
        id: name,
        label: name,
        status: 'unknown',
        detail: 'not installed in this app, so this run cannot say which version a build would use',
        remedy: '',
      }
    }

    return { id: name, label: name, status: 'ok', detail: version, remedy: '' }
  })
}

/**
 * The dependency names the app's own manifest declares, in a stable order.
 *
 * Read rather than spelled out, because naming the renderer's packages in this
 * source would be a Navirox package naming the renderer, which the import
 * boundary scan refuses everywhere outside the adapter. The app's manifest is
 * also the more honest source: it is what a build would install.
 */
function declaredPackages(directory: string, deps: IDoctorDeps): readonly string[] {
  const dependencies = readManifest(directory, deps)?.dependencies

  if (typeof dependencies !== 'object' || dependencies === null) {
    return []
  }

  return Object.keys(dependencies).sort()
}

function compatibilityChecks(directory: string, deps: IDoctorDeps): readonly IDoctorCheck[] {
  return [expoCheck(directory, deps), newArchitectureCheck(directory, deps), registryCheck()]
}

function expoCheck(directory: string, deps: IDoctorDeps): IDoctorCheck {
  const declared = declaresPackage(directory, FORBIDDEN_PACKAGE, deps)
  const installed = deps.exists(join(directory, 'node_modules', FORBIDDEN_PACKAGE))

  if (!declared && !installed) {
    return {
      id: FORBIDDEN_PACKAGE,
      label: `The ${FORBIDDEN_PACKAGE} meta-package`,
      status: 'ok',
      detail: 'not declared and not installed',
      remedy: '',
    }
  }

  return {
    id: FORBIDDEN_PACKAGE,
    label: `The ${FORBIDDEN_PACKAGE} meta-package`,
    status: 'fail',
    detail: declared ? "declared in this app's package.json" : 'present in node_modules',
    remedy: `Remove ${FORBIDDEN_PACKAGE}. It ships its own Metro config and Babel preset, and both collide with the Navirox pipeline.`,
  }
}

function newArchitectureCheck(directory: string, deps: IDoctorDeps): IDoctorCheck {
  const id = 'new-architecture'
  const label = 'The New Architecture'
  const declared = [
    ['android/gradle.properties', gradleNewArchitecture(directory, deps)],
    ['ios/Podfile.properties.json', podfileNewArchitecture(directory, deps)],
  ] as const

  const disabled = declared.find(([, value]) => value === false)
  if (disabled !== undefined) {
    return {
      id,
      label,
      status: 'fail',
      detail: `${disabled[0]} sets newArchEnabled=false`,
      remedy:
        'Remove that setting. Navirox targets the New Architecture only, so a legacy build is not a build this stack supports.',
    }
  }

  const enabled = declared.filter(([, value]) => value === true).map(([file]) => file)
  if (enabled.length > 0) {
    return { id, label, status: 'ok', detail: `ON, set in ${enabled.join(' and ')}`, remedy: '' }
  }

  return {
    id,
    label,
    status: 'unknown',
    detail:
      'neither android/gradle.properties nor ios/Podfile.properties.json sets newArchEnabled, so this run has nothing to read',
    remedy:
      'Nothing to do: React Native 0.86 defaults it on. This command reports the default as unknown rather than reading it as a yes.',
  }
}

function registryCheck(): IDoctorCheck {
  return {
    id: 'registry',
    label: 'The compatibility registry',
    status: 'unknown',
    detail: 'lands with 0.2, so nothing is checked here yet',
    remedy: '',
  }
}

/** The `engines.node` floor an app declares, or `undefined` when it declares none. */
function enginesNodeFloor(directory: string, deps: IDoctorDeps): string | undefined {
  const manifest = readManifest(directory, deps)
  const declared = (manifest?.engines as { node?: unknown } | undefined)?.node

  if (typeof declared !== 'string') {
    return undefined
  }

  const floor = declared.replace(/^[>=^~\s]+/, '').trim()
  return parseVersion(floor) === undefined ? undefined : floor
}

/** The `packageManager` field, as `pnpm@11.27.0` becomes `11.27.0`. */
function packageManagerVersion(directory: string, deps: IDoctorDeps): string | undefined {
  const manifest = readManifest(directory, deps)
  const declared = manifest?.packageManager

  if (typeof declared !== 'string' || !declared.startsWith('pnpm@')) {
    return undefined
  }

  const version = declared.slice('pnpm@'.length)
  return parseVersion(version) === undefined ? undefined : version
}

function declaresPackage(directory: string, name: string, deps: IDoctorDeps): boolean {
  const manifest = readManifest(directory, deps)

  for (const field of ['dependencies', 'devDependencies']) {
    const group = manifest?.[field] as Record<string, unknown> | undefined
    if (group !== undefined && name in group) {
      return true
    }
  }

  return false
}

function installedVersion(directory: string, name: string, deps: IDoctorDeps): string | undefined {
  const path = join(directory, 'node_modules', name, 'package.json')
  const version = readJson(deps, path)?.version

  return typeof version === 'string' ? version : undefined
}

function readManifest(directory: string, deps: IDoctorDeps): Record<string, unknown> | undefined {
  return readJson(deps, join(directory, 'package.json'))
}

function readJson(deps: IDoctorDeps, path: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(deps.readFile(path)) as Record<string, unknown>
  } catch {
    // A file that is absent, unreadable or malformed is an answer this command
    // reports as unknown rather than a reason to stop.
    return undefined
  }
}

/** The last `newArchEnabled` an app sets in `android/gradle.properties`, if any. */
function gradleNewArchitecture(directory: string, deps: IDoctorDeps): boolean | undefined {
  const text = readText(deps, join(directory, 'android', 'gradle.properties'))
  if (text === undefined) {
    return undefined
  }

  let value: boolean | undefined
  for (const line of text.split('\n')) {
    const match = /^\s*newArchEnabled\s*=\s*(true|false)\s*$/i.exec(line.trim())
    if (match !== null) {
      value = match[1]?.toLowerCase() === 'true'
    }
  }

  return value
}

/** The `newArchEnabled` an app sets in `ios/Podfile.properties.json`, if any. */
function podfileNewArchitecture(directory: string, deps: IDoctorDeps): boolean | undefined {
  const path = join(directory, 'ios', 'Podfile.properties.json')
  const declared = readJson(deps, path)?.newArchEnabled

  return typeof declared === 'boolean' ? declared : undefined
}

function readText(deps: IDoctorDeps, path: string): string | undefined {
  try {
    return deps.readFile(path)
  } catch {
    return undefined
  }
}

function parseVersion(text: string): readonly [number, number, number] | undefined {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(text.trim())
  if (match === null) {
    return undefined
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function compareVersions(left: string, right: string): number {
  const a = parseVersion(left) ?? [0, 0, 0]
  const b = parseVersion(right) ?? [0, 0, 0]

  for (let index = 0; index < 3; index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0)
    if (difference !== 0) {
      return difference > 0 ? 1 : -1
    }
  }

  return 0
}

function major(version: string): number | undefined {
  return parseVersion(version)?.[0]
}

function stripLeadingVee(version: string): string {
  return version.startsWith('v') ? version.slice(1) : version
}

/** The version a tool reports inside quotes, which is how `java -version` writes it. */
function quotedVersion(text: string): string | undefined {
  const match = /version "?([^"\s]+)"?/.exec(text)
  return match?.[1]
}

function firstLine(text: string): string {
  return (text.split('\n').find((line) => line.trim() !== '') ?? '').trim()
}
