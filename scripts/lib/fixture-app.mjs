/**
 * The fixture application helpers shared by the scripts that build a real app
 * out of the workspace: pack the publishable packages, scaffold outside the
 * checkout, install the freshly compiled screen as the app root, point the app
 * at the packed artifacts and check what was installed.
 *
 * The compile step itself lives in `@memolabs-apps/visual-benchmark`, so the
 * rule that only target compiler output may be captured has its unit tests
 * next to it instead of only here.
 */

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, sep } from 'node:path'

export const ROOT = new URL('../../', import.meta.url).pathname.replace(/\/$/, '')
export const PACKAGES_DIRECTORY = join(ROOT, 'packages')
export const SCAFFOLDER = join(ROOT, 'packages', 'create-navirox', 'dist', 'bin.js')
export const COMPILER = join(ROOT, 'packages', 'target-vue', 'dist', 'index.js')
export const BENCHMARK = join(ROOT, 'packages', 'visual-benchmark', 'dist', 'index.js')
export const LAUNCHER = join(ROOT, 'packages', 'navirox', 'dist', 'bin.js')
export const FIXTURES_DIRECTORY = join(ROOT, 'packages', 'target-vue', 'fixtures')

/**
 * Everything a caller has to name to prepare one fixture application: which
 * compiled screen becomes the app root, what the application is called, what
 * its bundles are named and which test identifiers the bundles must carry. A
 * second fixture passes its own record instead of these helpers growing a copy
 * of themselves. The values below are the records fixture, the first one this
 * project proved end to end.
 */
export const RECORDS_FIXTURE = {
  appName: 'records-fixture-app',
  webFixture: join(FIXTURES_DIRECTORY, 'records', 'RecordsScreen.web.vue'),
  emittedScreen: join(FIXTURES_DIRECTORY, 'records', 'RecordsScreen.native.vue'),
  outputPath: 'packages/target-vue/fixtures/records/RecordsScreen.native.vue',
  sourceName: 'RecordsScreen.web.vue',
  bundleName: 'records',
  rootTestId: 'records-screen',
  evidencePrefix: 'records-native-capture',
  movedUnits: [],
  testIds: [
    'records-screen',
    'records-loading',
    'records-empty',
    'records-error',
    'records-retry',
    'records-list',
    'record-row',
    'record-select',
    'record-detail',
  ],
}

export const WEB_FIXTURE = RECORDS_FIXTURE.webFixture
export const EMITTED_SCREEN = RECORDS_FIXTURE.emittedScreen
export const APP_NAME = RECORDS_FIXTURE.appName

export const TEST_IDS = RECORDS_FIXTURE.testIds

/**
 * The field-workflow fixture, the Vue proof journey's own screen. It shares the
 * shape above so the same helpers prepare it: the difference is which screen is
 * compiled into the app root and which identifiers the bundle has to carry.
 */
export const FIELD_WORKFLOW_FIXTURE = {
  appName: 'field-workflow-app',
  webFixture: join(FIXTURES_DIRECTORY, 'field-workflow', 'FieldWorkflowScreen.web.vue'),
  emittedScreen: join(FIXTURES_DIRECTORY, 'field-workflow', 'FieldWorkflowScreen.native.vue'),
  outputPath: 'packages/target-vue/fixtures/field-workflow/FieldWorkflowScreen.native.vue',
  sourceName: 'FieldWorkflowScreen.web.vue',
  bundleName: 'field-workflow',
  rootTestId: 'field-screen',
  evidencePrefix: 'native-capture',
  movedUnits: ['fieldLogic.ts', 'fieldRecords.ts'],
  testIds: [
    'field-screen',
    'field-list',
    'field-row',
    'field-select',
    'field-detail',
    'field-status',
    'field-status-toggle',
    'field-status-clear',
    'field-notes',
    'field-notes-edit',
    'field-attachment',
    'field-attach',
    'field-save',
    'field-saved',
    'field-error',
  ],
}

export function step(message) {
  process.stdout.write(`\n== ${message}\n`)
}

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

export function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', env: process.env })

  if (result.error !== undefined && result.error !== null) {
    throw new Error(`Could not run ${command}: ${result.error.message}`)
  }

  return result.status ?? 1
}

export function capture(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' })

  return { status: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' }
}

export function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

export function requireBuild() {
  for (const artifact of [SCAFFOLDER, COMPILER, BENCHMARK, LAUNCHER]) {
    assert(
      existsSync(artifact),
      `${artifact} is missing. Build the workspace first with \`pnpm build\`.`,
    )
  }
}

/** The directory a fixture's source files live in. */
/**
 * The Angular proof fixture. It has no compiled screen: the Angular journey has
 * no target compiler, so the companion's screen is hand-written work and this
 * record names the directory the adapter reads and the screen to install.
 */
export const ANGULAR_COMPANION_FIXTURE = {
  appName: 'angular-companion-app',
  directory: join(ROOT, 'packages', 'source-angular', 'fixtures', 'record-workflow'),
  screen: join(ROOT, 'packages', 'source-angular', 'companion', 'App.vue'),
  bundleName: 'angular-companion',
  testIds: [
    'record-workflow-screen',
    'record-workflow-queue',
    'record-workflow-row',
    'record-workflow-select',
    'record-workflow-detail',
    'record-workflow-field',
    'record-workflow-status',
    'record-workflow-attach',
    'record-workflow-attachment',
    'record-workflow-save',
    'record-workflow-saved',
    'record-workflow-error',
  ],
}

export function fixtureDirectory(fixture) {
  return fixture.directory ?? dirname(fixture.webFixture)
}

/**
 * Reads the fixture with the real source adapter, in the same read-only way the
 * benchmark does. The analysis is the evidence that a fixture is what the
 * adapter sees, not what a test author hoped it saw.
 */
export function analyzeFixture(fixture) {
  step('Analyzing the fixture with the source adapter')

  const result = capture(
    process.execPath,
    [LAUNCHER, 'analyze', fixtureDirectory(fixture), '--json'],
    ROOT,
  )

  assert(result.status === 0, `The analyze command exited ${result.status}.\n${result.stderr}`)

  return JSON.parse(result.stdout.trim())
}

/** Reads the planner's decisions for a fixture, which is what approves a move. */
export function planFixture(fixture) {
  step('Asking the planner which units may move')

  const result = capture(
    process.execPath,
    [LAUNCHER, 'plan', '-C', fixtureDirectory(fixture), '--json'],
    ROOT,
  )

  assert(result.status === 0, `The plan command exited ${result.status}.\n${result.stderr}`)

  return JSON.parse(result.stdout.trim())
}

/** The planner decision for one subject, or a loud failure when there is none. */
export function decisionFor(plan, subject) {
  const decision = plan.decisions.find((entry) => entry.subject === subject)

  assert(decision !== undefined, `The planner decided nothing about ${subject}.`)

  return decision
}

/**
 * Copies one source file into the prepared application unchanged. A unit that
 * moves is copied, never rewritten: the planner approved the behaviour, so the
 * bytes it approved are the bytes that travel.
 */
export function copyFixtureUnit(sourceDirectory, appDir, file) {
  const source = join(sourceDirectory, file)
  const target = join(appDir, file)

  assert(existsSync(source), `${source} does not exist, so it cannot move.`)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, readFileSync(source, 'utf8'))

  return target
}

/**
 * Copies every unit a fixture declares as moved into the prepared application,
 * beside the screen the compiler wrote to the app root. The generated screen
 * imports them, so an application without them cannot bundle.
 */
export function copyFixtureUnits(appDir, fixture) {
  const sourceDirectory = fixtureDirectory(fixture)
  const copied = []

  for (const file of fixture.movedUnits ?? []) {
    copied.push(copyFixtureUnit(sourceDirectory, appDir, file))
  }

  return copied
}

export function newWorkspace(prefix) {
  const workspace = mkdtempSync(join(tmpdir(), prefix))
  const artifactsDir = join(workspace, 'artifacts')

  mkdirSync(artifactsDir, { recursive: true })

  return { workspace, artifactsDir }
}

/** Scaffolds the app and returns its directory. */
export function scaffold(targetDir, appName = APP_NAME) {
  step(`Scaffolding "${appName}" into ${targetDir}`)

  const result = capture(process.execPath, [SCAFFOLDER, appName, '-d', targetDir, '--json'])
  assert(result.status === 0, `The scaffolder exited ${result.status}.\n${result.stderr}`)

  const report = JSON.parse(result.stdout.trim())
  assert(report.ok === true, `The scaffolder reported a failure: ${result.stdout}`)
  assert(report.files > 50, `Only ${report.files} files were written, which is too few.`)

  process.stdout.write(`   ${report.files} files\n`)

  return report.directory
}

/** Every workspace package a registry would serve, which is what the app consumes. */
export function publishablePackages() {
  return readdirSync(PACKAGES_DIRECTORY, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(PACKAGES_DIRECTORY, entry.name, 'package.json'))
    .filter((manifest) => existsSync(manifest))
    .map((manifest) => JSON.parse(readFileSync(manifest, 'utf8')))
    .filter((manifest) => manifest.private !== true)
    .map((manifest) => ({
      directory: join(PACKAGES_DIRECTORY, manifest.name.replace('@memolabs-apps/', '')),
      name: manifest.name,
      version: manifest.version,
    }))
}

export function pack(destination, packages) {
  step(`Packing ${packages.length} Navirox packages`)

  const artifacts = new Map()

  for (const entry of packages) {
    const artifact = join(
      destination,
      `${entry.name.replace(/^@/, '').replace('/', '-')}-${entry.version}.tgz`,
    )
    const result = capture('pnpm', ['pack', '--out', artifact], entry.directory)

    assert(
      result.status === 0,
      `pnpm pack exited ${result.status} for ${entry.name}.\n${result.stdout}${result.stderr}`,
    )
    assert(existsSync(artifact), `pnpm pack wrote no artifact for ${entry.name}.`)
    artifacts.set(entry.name, artifact)
  }

  process.stdout.write(`   ${artifacts.size} artifacts\n`)

  return artifacts
}

/**
 * Compiles the web fixture fresh and installs it as the app root. The check
 * that the fresh output hashes to the checked-in emitted file is what keeps a
 * hand-written screen from passing as generated output.
 */
export async function installGeneratedScreen(appDir, fixture = RECORDS_FIXTURE) {
  step(`Compiling the ${fixture.sourceName} fresh from the web fixture`)

  const { compileFixtureScreen } = await import(BENCHMARK)
  const result = await compileFixtureScreen({
    compilerEntry: COMPILER,
    webFixture: fixture.webFixture,
    emittedScreen: fixture.emittedScreen,
    outputPath: fixture.outputPath,
    sourceName: fixture.sourceName,
  })

  writeFileSync(join(appDir, 'App.vue'), result.code)
  process.stdout.write(`   manifest ${result.manifestHash} compiler ${result.compilerVersion}\n`)

  return result
}

export function consumeFromArtifacts(appDir, artifacts) {
  step('Pointing the app at the artifacts')

  const manifestPath = join(appDir, 'package.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  let direct = 0

  for (const group of ['dependencies', 'devDependencies']) {
    for (const [name] of Object.entries(manifest[group] ?? {})) {
      const artifact = artifacts.get(name)

      if (artifact !== undefined) {
        manifest[group][name] = `file:${artifact}`
        direct += 1
      }
    }
  }

  assert(direct > 0, 'The app depends on no Navirox package, so there is nothing to install.')
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  const settingsPath = join(appDir, 'pnpm-workspace.yaml')
  const overrides = [...artifacts]
    .map(([name, artifact]) => `  '${name}': file:${artifact}`)
    .join('\n')
  writeFileSync(settingsPath, `${readFileSync(settingsPath, 'utf8')}\noverrides:\n${overrides}\n`)

  process.stdout.write(`   ${direct} direct, ${artifacts.size} overridden\n`)
}

export function install(appDir) {
  step('Installing the app')

  const status = run('pnpm', ['install'], appDir)

  assert(status === 0, `pnpm install exited ${status}. The app a user gets does not install.`)
}

/**
 * Installs the iOS dependencies of a prepared application. The template ships
 * a Podfile and a Podfile.lock but no Pods directory, so xcodebuild has nothing
 * to link against until this runs. It is preparation rather than capture: the
 * device driver builds whatever the caller prepared.
 *
 * CocoaPods 1.17 can fail while it generates the Pods project with
 * `ArgumentError - pathname contains null byte` (cocoapods/cocoapods issues
 * 12798 and 12866, both open). The failure is inside CocoaPods' own file
 * reference generation, before any code of this project runs, and it is
 * intermittent: the same tree installs on the next attempt. Three attempts keep
 * a run from failing on someone else's race while still failing loudly when the
 * Podfile itself is wrong.
 */
export function installIosPods(appDir) {
  step('Installing the iOS dependencies')

  const iosDirectory = join(appDir, 'ios')
  let status = 1

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    status = run('pod', ['install'], iosDirectory)

    if (status === 0) {
      return
    }

    process.stdout.write(`   pod install exited ${status} on attempt ${attempt} of 3\n`)
  }

  assert(
    status === 0,
    `pod install exited ${status} on three attempts, so the iOS build cannot start.`,
  )
}

export function lintApp(appDir) {
  step('Linting the app with the generated root screen')

  const status = run('pnpm', ['run', 'lint'], appDir)

  assert(status === 0, `The app's lint exited ${status} with the generated screen as root.`)
}

export function assertInstalledFromArtifacts(appDir, packages) {
  step('Checking the packages came from the artifacts')

  const root = realpathSync(appDir)
  let checked = 0

  for (const entry of packages) {
    const installed = join(appDir, 'node_modules', entry.name)

    if (!existsSync(installed)) {
      continue
    }

    const real = realpathSync(installed)
    assert(
      real.startsWith(`${root}${sep}`),
      `${entry.name} resolves to ${real}, which is outside the app.`,
    )
    checked += 1
  }

  assert(checked > 0, 'No Navirox package was found inside the app.')
  process.stdout.write(`   ${checked} inside the app\n`)
}

export const SINGLE_COPY_PACKAGES = [
  'react',
  'react-native',
  'vue',
  '@symbiote-native/vue',
  '@symbiote-native/engine',
]

export function installedCopies(directory, name) {
  const wanted = `${sep}node_modules${sep}${name.split('/').join(sep)}`
  const found = new Set()

  const walk = (current, depth) => {
    if (depth > 6) {
      return
    }

    for (const entry of readdirSync(current, { withFileTypes: true })) {
      // Only real directories: the links pnpm writes at the top of
      // `node_modules` are not directories, and resolving them would count the
      // same copy twice.
      if (!entry.isDirectory()) {
        continue
      }

      const path = join(current, entry.name)

      if (path.endsWith(wanted)) {
        found.add(realpathSync(path))
      } else {
        walk(path, depth + 1)
      }
    }
  }

  walk(directory, 0)

  return [...found]
}

export function assertSingleRuntime(appDir) {
  step('Checking one copy of each runtime package')

  for (const name of SINGLE_COPY_PACKAGES) {
    const copies = installedCopies(join(appDir, 'node_modules'), name)

    assert(
      copies.length === 1,
      `${copies.length} copies of ${name} are installed:\n  ${copies.join('\n  ')}\nA package that loads the runtime must share the app's copy, not bring its own.`,
    )
  }

  process.stdout.write(`   ${SINGLE_COPY_PACKAGES.length} packages, one copy each\n`)
}

export function bundle(appDir, workspace, platform, bundleName = RECORDS_FIXTURE.bundleName) {
  step(`Bundling ${platform}`)

  const output = join(workspace, `${bundleName}.${platform}.bundle`)
  const status = run(
    join(appDir, 'node_modules', '.bin', 'react-native'),
    [
      'bundle',
      '--platform',
      platform,
      '--dev',
      'true',
      '--entry-file',
      'index.js',
      '--bundle-output',
      output,
    ],
    appDir,
  )

  assert(status === 0, `Bundling for ${platform} exited ${status}.`)
  assert(existsSync(output), `Metro exited cleanly but wrote no ${platform} bundle.`)

  const { size } = statSync(output)
  assert(size > 1_000_000, `The ${platform} bundle is ${size} bytes, too small to be real.`)
  process.stdout.write(`   ${platform}: ${Math.round(size / 1000)} kB\n`)

  return output
}

export function assertTestIds(bundlePath, platform, testIds = TEST_IDS) {
  const bundleText = readFileSync(bundlePath, 'utf8')
  const missing = testIds.filter((id) => !bundleText.includes(id))

  assert(
    missing.length === 0,
    `The ${platform} bundle is missing test identifiers: ${missing.join(', ')}.`,
  )
  process.stdout.write(`   ${platform}: ${testIds.length}/${testIds.length} testIDs present\n`)
}

export function removeWorkspace(workspace, artifactsDir) {
  rmSync(join(workspace, 'app'), { recursive: true, force: true })
  rmSync(artifactsDir, { recursive: true, force: true })
}
