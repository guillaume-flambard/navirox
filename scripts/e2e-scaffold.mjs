#!/usr/bin/env node
/**
 * The NX-006 end to end check.
 *
 * Scaffolds an app into a temporary directory, installs it, and optionally
 * builds a platform. This is the test PLAN.md asks for under NX-006, and it is
 * deliberately not part of `pnpm test`: it reaches the network to install, and a
 * platform build takes minutes with a native toolchain, so it runs as its own
 * job instead of slowing down the suite a contributor runs on every save.
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
  lstatSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SCAFFOLDER = join(REPO_ROOT, 'packages', 'create-navirox', 'dist', 'bin.js')
const APP_NAME = 'E2E App'
const LINKED_PACKAGES = ['cli', 'metro-preset', 'runtime-symbiote']

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
function scaffold(workspace) {
  step(`Scaffolding "${APP_NAME}" into ${workspace}`)

  const result = capture(process.execPath, [SCAFFOLDER, APP_NAME, '-d', workspace, '--json'])
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

function install(appDir) {
  step('Installing the app')

  const status = run('pnpm', ['install'], appDir)

  assert(status === 0, `pnpm install exited ${status}. The app a user gets does not install.`)
}

/** Checks the three Navirox packages are linked at this checkout, not copied from a registry. */
function assertLinkedPackages(appDir) {
  step('Checking the linked packages')

  for (const name of LINKED_PACKAGES) {
    const path = join(appDir, 'node_modules', '@navirox', name)

    assert(existsSync(path), `${path} is missing, so the app cannot use @navirox/${name}.`)
    assert(
      lstatSync(path).isSymbolicLink(),
      `${path} is not a symlink. An unpublished package has to be linked from the checkout.`,
    )
  }

  process.stdout.write(`   ${LINKED_PACKAGES.length} packages linked\n`)
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
 * The wrapper config exists because `@navirox/*` is not published yet, so the
 * scaffolder links those packages into the app with `file:` ranges and their
 * sources sit in this checkout instead of in the app. Metro watches and searches
 * only the project root, so it cannot follow a link that leaves the app, and
 * transforming those out-of-app files then needs `@babel/runtime` reachable from
 * them, because the React Native Babel preset turns on transform-runtime for
 * every module it compiles. The wrapper requires the app's own config and adds
 * the two roots, so the transformer, the source extensions and the Vue pipeline
 * are all still the ones the template ships. A published app installs everything
 * inside its own root and needs none of this, which is why the template carries
 * no such file.
 */
function bundle(appDir, workspace, platform) {
  step(`Bundling ${platform}`)

  writeFileSync(
    join(appDir, 'metro.e2e.config.js'),
    [
      "const { join } = require('node:path');",
      "const config = require('./metro.config.js');",
      'const repoRoot = process.env.NAVIROX_E2E_REPO;',
      'config.watchFolders = [__dirname, repoRoot];',
      "config.resolver.nodeModulesPaths = [join(__dirname, 'node_modules'), join(repoRoot, 'node_modules')];",
      'module.exports = config;',
      '',
    ].join('\n'),
  )

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
      '--config',
      'metro.e2e.config.js',
    ],
    appDir,
    { NAVIROX_E2E_REPO: REPO_ROOT },
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
  let appDir

  try {
    const report = scaffold(workspace)
    appDir = report.directory

    install(appDir)
    assertLinkedPackages(appDir)
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
