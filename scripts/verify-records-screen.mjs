/**
 * Verifies the generated records screen the way a user would meet it.
 *
 * The compiler output is already pinned byte for byte by the target-vue unit
 * tests. This script proves the next step: a scaffolded app that installs the
 * packed candidate, runs the freshly compiled screen as its root component,
 * and still bundles for both platforms with the stable test identifiers in
 * the bundles. Compile happens here from the web fixture, so a hand-written
 * replacement cannot sneak in: the script refuses to continue unless the
 * fresh output hashes exactly to the checked-in emitted file.
 *
 * Usage: node scripts/verify-records-screen.mjs [--keep]
 */

import { createHash } from 'node:crypto'
import { mkdtempSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { existsSync, statSync } from 'node:fs'
import { join, sep } from 'node:path'
import { spawnSync } from 'node:child_process'

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '')
const PACKAGES_DIRECTORY = join(ROOT, 'packages')
const SCAFFOLDER = join(ROOT, 'packages', 'create-navirox', 'dist', 'bin.js')
const COMPILER = join(ROOT, 'packages', 'target-vue', 'dist', 'index.js')
const WEB_FIXTURE = join(
  ROOT,
  'packages',
  'target-vue',
  'fixtures',
  'records',
  'RecordsScreen.web.vue',
)
const EMITTED_SCREEN = join(
  ROOT,
  'packages',
  'target-vue',
  'fixtures',
  'records',
  'RecordsScreen.native.vue',
)
const APP_NAME = 'records-fixture-app'

const TEST_IDS = [
  'records-screen',
  'records-loading',
  'records-empty',
  'records-error',
  'records-retry',
  'records-list',
  'record-row',
  'record-select',
  'record-detail',
]

function step(message) {
  process.stdout.write(`\n== ${message}\n`)
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', env: process.env })

  if (result.error !== undefined && result.error !== null) {
    throw new Error(`Could not run ${command}: ${result.error.message}`)
  }

  return result.status ?? 1
}

function capture(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' })

  return { status: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' }
}

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

function requireBuild() {
  for (const artifact of [SCAFFOLDER, COMPILER]) {
    assert(
      existsSync(artifact),
      `${artifact} is missing. Build the workspace first with \`pnpm build\`.`,
    )
  }
}

/** Scaffolds the app and returns its directory. */
function scaffold(targetDir) {
  step(`Scaffolding "${APP_NAME}" into ${targetDir}`)

  const result = capture(process.execPath, [SCAFFOLDER, APP_NAME, '-d', targetDir, '--json'])
  assert(result.status === 0, `The scaffolder exited ${result.status}.\n${result.stderr}`)

  const report = JSON.parse(result.stdout.trim())
  assert(report.ok === true, `The scaffolder reported a failure: ${result.stdout}`)
  assert(report.files > 50, `Only ${report.files} files were written, which is too few.`)

  process.stdout.write(`   ${report.files} files\n`)

  return report.directory
}

/** Every workspace package a registry would serve, which is what the app consumes. */
function publishablePackages() {
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

function pack(destination, packages) {
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
 * Compiles the web fixture fresh and installs it as the app root. The hash
 * comparison against the checked-in emitted file is what keeps a hand-written
 * screen from passing as generated output.
 */
async function installGeneratedScreen(appDir) {
  step('Compiling the records screen fresh from the web fixture')

  const { compileVueTarget, hashProvenanceManifest } = await import(COMPILER)
  const source = readFileSync(WEB_FIXTURE, 'utf8')
  const emitted = readFileSync(EMITTED_SCREEN, 'utf8')
  const result = compileVueTarget(
    source,
    'RecordsScreen.web.vue',
    'packages/target-vue/fixtures/records/RecordsScreen.native.vue',
  )

  assert(
    result.report.findings.length === 0,
    `The fixture no longer compiles cleanly: ${JSON.stringify(result.report.findings, null, 2)}`,
  )
  assert(result.code !== undefined, 'The compiler reported no findings but emitted no code.')
  assert(
    sha256(result.code) === sha256(emitted),
    'Fresh compiler output differs from the checked-in emitted file. Regenerate the fixture instead of editing it.',
  )

  writeFileSync(join(appDir, 'App.vue'), result.code)
  process.stdout.write(
    `   manifest ${hashProvenanceManifest(result.manifest)} compiler ${result.manifest.compilerVersion}\n`,
  )
}

function consumeFromArtifacts(appDir, artifacts) {
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

function install(appDir) {
  step('Installing the app')

  const status = run('pnpm', ['install'], appDir)

  assert(status === 0, `pnpm install exited ${status}. The app a user gets does not install.`)
}

function lintApp(appDir) {
  step('Linting the app with the generated root screen')

  const status = run('pnpm', ['run', 'lint'], appDir)

  assert(status === 0, `The app's lint exited ${status} with the generated screen as root.`)
}

function assertInstalledFromArtifacts(appDir, packages) {
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

const SINGLE_COPY_PACKAGES = [
  'react',
  'react-native',
  'vue',
  '@symbiote-native/vue',
  '@symbiote-native/engine',
]

function installedCopies(directory, name) {
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

function assertSingleRuntime(appDir) {
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

function bundle(appDir, workspace, platform) {
  step(`Bundling ${platform}`)

  const output = join(workspace, `records.${platform}.bundle`)
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

function assertTestIds(bundlePath, platform) {
  const bundleText = readFileSync(bundlePath, 'utf8')
  const missing = TEST_IDS.filter((id) => !bundleText.includes(id))

  assert(
    missing.length === 0,
    `The ${platform} bundle is missing test identifiers: ${missing.join(', ')}.`,
  )
  process.stdout.write(`   ${platform}: ${TEST_IDS.length}/${TEST_IDS.length} testIDs present\n`)
}

async function main() {
  const keep = process.argv.includes('--keep')
  requireBuild()

  const workspace = mkdtempSync(join(tmpdir(), 'navirox-records-'))
  const artifactsDir = join(workspace, 'artifacts')
  const { mkdirSync } = await import('node:fs')
  mkdirSync(artifactsDir, { recursive: true })

  const packages = publishablePackages()
  const artifacts = pack(artifactsDir, packages)
  const appDir = scaffold(join(workspace, 'app'))
  await installGeneratedScreen(appDir)
  consumeFromArtifacts(appDir, artifacts)
  install(appDir)
  lintApp(appDir)
  assertInstalledFromArtifacts(appDir, packages)
  assertSingleRuntime(appDir)

  const iosBundle = bundle(appDir, workspace, 'ios')
  const androidBundle = bundle(appDir, workspace, 'android')
  assertTestIds(iosBundle, 'ios')
  assertTestIds(androidBundle, 'android')

  process.stdout.write(`\nDone. Workspace: ${workspace}${keep ? ' (kept)' : ''}\n`)

  if (!keep) {
    const { rmSync } = await import('node:fs')
    rmSync(join(workspace, 'app'), { recursive: true, force: true })
    rmSync(artifactsDir, { recursive: true, force: true })
  }
}

await main()
