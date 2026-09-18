#!/usr/bin/env node
/**
 * The NX-006 end to end check.
 *
 * It reproduces the consumer installation model, not the workspace one. The
 * Navirox packages are packed into artifacts, the app is scaffolded into a
 * temporary directory outside this repository, and it then installs those
 * artifacts the way it would install published packages. Nothing about the app
 * points back at this checkout, so what runs here is what a user will get.
 *
 * That difference is the whole point. An app that consumes the packages through
 * `link:` (what the scaffolder writes while the packages are unpublished) has
 * `@navirox/*` living in this repository and its own dependencies living in its
 * own store, and Metro resolves React Native from whichever tree the importing
 * file sits in. Two stores means two copies of React Native, two module
 * registries, and a red screen on launch. Packing and installing into the app
 * gives it one tree, which is the shape a published install has.
 *
 * It exists because four real bugs in the scaffolder were invisible to unit
 * tests: a `file:` range computed lexically while a package manager resolves it
 * physically, a `file:` link dragging the linked package's own workspace ranges
 * along with it, pnpm refusing to install an app that never declared
 * `allowBuilds`, and an app that could not bundle because it never declared a
 * package the SFC transform writes into a component. The first three only
 * appeared once a scaffolded app was actually installed. The fourth only appears
 * once Metro runs, which compiling native code never does.
 *
 * Usage:
 *   node scripts/e2e-scaffold.mjs [--bundle] [--build android] [--build ios] [--keep]
 *
 * `--build` may be repeated. `--bundle` bundles both platforms with Metro, which
 * needs no native toolchain and takes seconds, so it is the cheap half of this
 * check. `--keep` leaves the temporary app in place so it can be inspected after
 * a failure.
 */

import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PACKAGES_DIRECTORY = join(REPO_ROOT, 'packages')
const SCAFFOLDER = join(PACKAGES_DIRECTORY, 'create-navirox', 'dist', 'bin.js')
const APP_NAME = 'E2E App'

/**
 * The runtime packages the app and the linked packages both load. Two physical
 * copies of any of these is the failure this check was written for: two module
 * registries, and a red screen that says a JavaScript module method was never
 * registered.
 */
const SINGLE_COPY_PACKAGES = [
  'react',
  'react-native',
  'vue',
  '@symbiote-native/vue',
  '@symbiote-native/engine',
]

function parseArguments(argv) {
  const options = { builds: [], bundle: false, keep: false }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]

    if (argument === '--keep') {
      options.keep = true
    } else if (argument === '--bundle') {
      options.bundle = true
    } else if (argument === '--build') {
      const platform = argv[index + 1]
      index += 1

      if (platform !== 'android' && platform !== 'ios') {
        throw new Error(`--build expects android or ios, not "${platform}".`)
      }

      options.builds.push(platform)
    } else {
      throw new Error(`Unknown argument "${argument}". See the header of this file.`)
    }
  }

  return options
}

/** Runs a command and lets its output through, for steps a human wants to read. */
function run(command, args, cwd, env) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  })

  if (result.error !== undefined && result.error !== null) {
    throw new Error(`Could not run ${command}: ${result.error.message}`)
  }

  return result.status ?? 1
}

/** Runs a command and captures its output, for steps the script has to read. */
function capture(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' })

  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  }
}

function step(message) {
  process.stdout.write(`\n== ${message}\n`)
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function requireBuild() {
  if (!existsSync(SCAFFOLDER)) {
    throw new Error(
      `${SCAFFOLDER} is missing. Build the workspace first with \`pnpm build\`, because this check runs the scaffolder the way a user would.`,
    )
  }
}

/** Scaffolds the app and returns what the scaffolder reported, plus its directory. */
function scaffold(targetDir) {
  step(`Scaffolding "${APP_NAME}" into ${targetDir}`)

  const result = capture(process.execPath, [SCAFFOLDER, APP_NAME, '-d', targetDir, '--json'])
  assert(result.status === 0, `The scaffolder exited ${result.status}.\n${result.stderr}`)

  const report = JSON.parse(result.stdout.trim())
  assert(report.ok === true, `The scaffolder reported a failure: ${result.stdout}`)
  assert(report.files > 50, `Only ${report.files} files were written, which is too few.`)
  assert(
    report.warnings.length > 0,
    'The scaffolder said nothing about the packages being linked, and a fresh app has to be told.',
  )

  process.stdout.write(`   ${report.files} files, ${report.warnings.length} note\n`)

  return report
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
      directory: join(PACKAGES_DIRECTORY, manifest.name.replace('@navirox/', '')),
      name: manifest.name,
      version: manifest.version,
    }))
}

/**
 * Packs every publishable package, which is the step that turns this checkout
 * into something installable. A tarball is not a symlink: installing one gives
 * the app a copy of its own, so nothing it loads resolves back here.
 */
function pack(destination, packages) {
  step(`Packing ${packages.length} Navirox packages`)

  const artifacts = new Map()

  for (const entry of packages) {
    // Captured rather than inherited: `pnpm pack` prints the whole tarball
    // listing, and only a failure is worth reading.
    const result = capture('pnpm', ['pack', '--pack-destination', destination], entry.directory)

    assert(
      result.status === 0,
      `pnpm pack exited ${result.status} for ${entry.name}.\n${result.stdout}${result.stderr}`,
    )

    const artifact = join(
      destination,
      `${entry.name.replace('@navirox/', 'navirox-')}-${entry.version}.tgz`,
    )

    assert(existsSync(artifact), `pnpm pack wrote no artifact for ${entry.name}.`)
    artifacts.set(entry.name, artifact)
  }

  process.stdout.write(`   ${artifacts.size} artifacts\n`)

  return artifacts
}

/**
 * Points the app at the artifacts instead of the checkout, standing in for the
 * registry a published app would use.
 *
 * The overrides are the other half of that: the packed manifests ask for the
 * Navirox packages by version, and a registry would resolve those requirements
 * itself. Here nothing is published, so every Navirox name in the graph is
 * pinned to its tarball. pnpm keeps those in `pnpm-workspace.yaml`, not in the
 * `pnpm` field of `package.json`, which it no longer reads.
 */
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

/**
 * Lints the app from its own directory, which is the only place the template's
 * `eslint.config.js` is ever executed. The root `lint` script is a single
 * `eslint` call scoped to the workspace packages and never reads it, so a config
 * that cannot load stays invisible until a user runs the lint of the app they
 * were handed.
 */
function lintApp(appDir) {
  step('Linting the app')

  const status = run('pnpm', ['run', 'lint'], appDir)

  assert(status === 0, `The app's lint exited ${status}. The config a user receives does not run.`)
}

/**
 * Checks the Navirox packages resolved inside the app rather than back at this
 * checkout. A `link:` or a symlink into the repository means the app is testing
 * this machine's tree, not the artifact a user would install.
 */
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
      `${entry.name} resolves to ${real}, which is outside the app. The app has to install it, not reach into the checkout.`,
    )
    checked += 1
  }

  assert(checked > 0, 'No Navirox package was installed, so nothing was verified.')
  process.stdout.write(`   ${checked} packages resolve inside the app\n`)
}

/** Every physical copy of `name` installed under `directory`, symlinks resolved. */
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

/**
 * Checks the app and the packages it loads share one copy of each runtime. Two
 * copies is the failure this check exists for: Metro resolves each import from
 * the tree the importing file sits in, so React Native ends up loaded twice,
 * `HMRClient.setup` is called on a module registry that never saw it, and the
 * app dies on a red screen that names neither the package nor the cause.
 */
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

function assertHelp(appDir) {
  step('Asking the app for its help text')

  const result = capture(join(appDir, 'node_modules', '.bin', 'navirox'), ['--help'], appDir)

  assert(result.status === 0, `navirox --help exited ${result.status}.\n${result.stderr}`)
  assert(
    result.stdout.includes('navirox <command> [options]'),
    `navirox --help does not say how it is called:\n${result.stdout}`,
  )
  assert(result.stdout.includes('dev'), 'navirox --help does not mention the dev command.')
}

/** Reads the app key the platform projects register, which is also the iOS target name. */
function appKey(appDir) {
  const manifest = JSON.parse(readFileSync(join(appDir, 'app.json'), 'utf8'))

  return manifest.name
}

function buildAndroid(appDir) {
  step('Building Android')

  const status = run(join(appDir, 'android', 'gradlew'), ['assembleDebug'], join(appDir, 'android'))

  assert(status === 0, `The Android build exited ${status}.`)
}

function buildIos(appDir) {
  const key = appKey(appDir)

  step('Installing CocoaPods for iOS')

  const pods = run('pod', ['install'], join(appDir, 'ios'))

  assert(pods === 0, `pod install exited ${pods}, so the iOS build cannot start.`)

  step('Building iOS')

  const derivedData = join(appDir, '.e2e-derived-data')
  const status = run(
    'xcodebuild',
    [
      '-workspace',
      join(appDir, 'ios', `${key}.xcworkspace`),
      '-scheme',
      key,
      '-configuration',
      'Debug',
      '-sdk',
      'iphonesimulator',
      '-derivedDataPath',
      derivedData,
      'build',
    ],
    appDir,
  )

  assert(status === 0, `The iOS build exited ${status}.`)
}

/**
 * Bundles the app with Metro, which is the only step here that runs the
 * JavaScript pipeline. It catches what nothing else does: a component that type
 * checks, builds on both platforms, and still cannot bundle.
 *
 * It runs through the app's own `metro.config.js`, with no help from this
 * script. That is only possible because the app installed the Navirox packages
 * instead of linking them, so nothing Metro has to read lives outside the app.
 * A template that dropped the preset, lost the Vue transform, or forgot to
 * declare a package the SFC transform injects fails here.
 */
function bundle(appDir, workspace, platform) {
  step(`Bundling ${platform}`)

  const output = join(workspace, `index.${platform}.bundle`)
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

  assert(status === 0, `Bundling for ${platform} exited ${status}, so the app does not bundle.`)
  assert(existsSync(output), `Metro exited cleanly but wrote no ${platform} bundle.`)

  const { size } = statSync(output)
  assert(
    size > 1_000_000,
    `The ${platform} bundle is ${size} bytes, which is too small to be real.`,
  )

  process.stdout.write(`   ${platform}: ${Math.round(size / 1000)} kB\n`)
}

function main() {
  const options = parseArguments(process.argv.slice(2))

  requireBuild()

  const workspace = mkdtempSync(join(tmpdir(), 'navirox-e2e-'))
  // The app goes in its own directory beside the artifacts. The scaffolder
  // refuses a target that already holds something, and packing has to happen
  // before scaffolding because the app installs what came out of it.
  const appTarget = join(workspace, 'app')
  const packages = publishablePackages()
  let appDir

  try {
    const artifacts = pack(join(workspace, 'artifacts'), packages)
    const report = scaffold(appTarget)
    appDir = report.directory

    consumeFromArtifacts(appDir, artifacts)
    install(appDir)
    lintApp(appDir)
    assertInstalledFromArtifacts(appDir, packages)
    assertSingleRuntime(appDir)
    assertHelp(appDir)

    if (options.bundle) {
      for (const platform of ['ios', 'android']) {
        bundle(appDir, workspace, platform)
      }
    }

    for (const platform of options.builds) {
      if (platform === 'android') {
        buildAndroid(appDir)
      } else {
        buildIos(appDir)
      }
    }

    process.stdout.write(`\nThe scaffolded app is intact: ${appDir}\n`)
    return 0
  } catch (error) {
    process.stderr.write(`\n${error.message}\n`)

    if (appDir !== undefined) {
      process.stderr.write(`The app was left at ${appDir} for inspection.\n`)
      options.keep = true
    }

    return 1
  } finally {
    if (!options.keep) {
      rmSync(workspace, { recursive: true, force: true })
    }
  }
}

process.exitCode = main()
