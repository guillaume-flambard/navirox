#!/usr/bin/env node
//
// Captures the records scenario on a real device, from the application the
// target compiler emitted. The script prepares the fixture application the same
// way the bundle check does, installs the device harness, writes the scenario
// into the application, runs the capture for one platform and records what
// happened, including what it could not do.
//
// The web capture runs in the same pass so a measurement has both sides. The
// other platform is recorded as unavailable with a reason rather than skipped,
// because a scenario that silently reports nothing looks complete.
//
// iOS preparation includes installing the template's CocoaPods dependencies: the
// template ships a Podfile and a lockfile but no Pods directory, so xcodebuild
// has nothing to link against until they are installed.
//
// Exits 0 when the web capture and every capture the scenario declares for the
// selected platform exist and the motion labels, when the scenario declares
// motion, are in the required order. Exits 1 when a capture is missing. Exits 2
// when the scenario is invalid.
//
// Usage:
//   node packages/visual-benchmark/scripts/capture-records-native.mjs --platform ios
//   node packages/visual-benchmark/scripts/capture-records-native.mjs --platform android --keep
//   node packages/visual-benchmark/scripts/capture-records-native.mjs --platform ios --workspace /tmp/capture
//
// `--workspace <path>` writes into a named directory and keeps it, so a caller
// that uploads the captures knows where they are before the run starts.

import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import {
  ROOT,
  assert,
  assertInstalledFromArtifacts,
  assertSingleRuntime,
  consumeFromArtifacts,
  install,
  installGeneratedScreen,
  installIosPods,
  newWorkspace,
  pack,
  publishablePackages,
  removeWorkspace,
  requireBuild,
  scaffold,
  step,
} from '../../../scripts/lib/fixture-app.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG = join(HERE, '..')
const EVIDENCE_DIRECTORY = join(ROOT, 'docs', 'evidence')
// The web half of a capture run needs a browser, and the browser is a property
// of the machine rather than of the scenario: macOS keeps Chrome in the
// application bundle while a Linux runner installs it as a command. The
// override exists so one script captures on both, instead of a second script
// that differs by one path.
const CHROME_PATH =
  process.env.NAVIROX_CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const VITE_PORT = 5202
const BASE_URL = `http://127.0.0.1:${VITE_PORT}`
const ROOT_TEST_ID = 'records-screen'
const PLATFORMS = ['ios', 'android']
const MOTION_ORDER = ['rest', 'first-meaningful', 'midpoint', 'settled', 'interrupted']

const RECORDS_SCENARIO = {
  name: 'records-list',
  route: '/records',
  dataStatus: 'ready',
  viewportWidth: 390,
  viewportHeight: 844,
  device: 'web-chrome-390x844',
  colourScheme: 'light',
  fontScale: 1,
  reducedMotion: false,
  actions: [],
  captures: [{ key: 'rest', moment: 'rest' }],
  masks: [],
}

// The same fixture driven through its own interaction, so the five temporal
// labels are produced on a device exactly as the web runner produces them. The
// fixture is a discrete state machine, so some frames coincide; the report names
// the frames that share a hash instead of hiding them.
const MOTION_SCENARIO = {
  name: 'records-motion',
  route: '/records',
  dataStatus: 'ready',
  viewportWidth: 390,
  viewportHeight: 844,
  device: 'web-chrome-390x844',
  colourScheme: 'light',
  fontScale: 1,
  reducedMotion: false,
  actions: [],
  captures: [
    { key: 'rest', moment: 'rest' },
    { key: 'first-meaningful', moment: 'first-meaningful', actions: [{ press: 'record-select' }] },
    { key: 'midpoint', moment: 'midpoint', actions: [{ press: 'record-select', nth: 1 }] },
    {
      key: 'settled',
      moment: 'settled',
      actions: [
        { press: 'record-select', nth: 1 },
        { press: 'record-select', nth: 1 },
      ],
    },
    {
      key: 'interrupted',
      moment: 'interrupted',
      actions: [{ press: 'record-select' }, { press: 'record-select', nth: 1 }],
    },
  ],
  masks: [],
  motion: {
    interaction: 'select a record, then replace the selection with a second press',
    interruptible: true,
  },
}

const SCENARIOS = [RECORDS_SCENARIO, MOTION_SCENARIO]

function parseArguments(argv) {
  const options = {
    platform: 'ios',
    keep: false,
    workspace: undefined,
    scenarios: SCENARIOS.map(({ name }) => name),
  }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]

    if (argument === '--platform') {
      index += 1
      options.platform = argv[index]
    } else if (argument === '--scenario') {
      index += 1
      options.scenarios = [argv[index]]
    } else if (argument === '--workspace') {
      index += 1
      options.workspace = argv[index]
    } else if (argument === '--keep') {
      options.keep = true
    } else {
      throw new Error(`Unknown argument ${argument}.`)
    }
  }

  if (!PLATFORMS.includes(options.platform)) {
    throw new Error(`--platform must be one of ${PLATFORMS.join(', ')}.`)
  }

  const names = SCENARIOS.map((scenario) => scenario.name)
  const unknown = options.scenarios.filter((name) => !names.includes(name))

  if (unknown.length > 0) {
    throw new Error(`--scenario must be one of ${names.join(', ')}.`)
  }

  return options
}

function digest(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

/**
 * Prepares a named workspace instead of a temporary one. Continuous integration
 * uploads the captures after the run, so the directory it uploads has to be the
 * one the run wrote, and it has to be known before the run starts.
 */
function namedWorkspace(path) {
  const workspace = resolve(path)
  const artifactsDir = join(workspace, 'artifacts')

  mkdirSync(artifactsDir, { recursive: true })

  return { workspace, artifactsDir }
}

function deviceName(platform) {
  return process.env.NAVIROX_DEVICE ?? (platform === 'ios' ? 'iPhone 17' : 'atable_pixel')
}

function applicationName(appDirectory) {
  return JSON.parse(readFileSync(join(appDirectory, 'app.json'), 'utf8')).name
}

function binaryPath(appDirectory, platform) {
  if (platform === 'ios') {
    const name = applicationName(appDirectory)

    return join(
      appDirectory,
      'ios',
      'build',
      'Build',
      'Products',
      'Debug-iphonesimulator',
      `${name}.app`,
    )
  }

  return join(appDirectory, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
}

function addHarnessDependencies(appDirectory, dependencies) {
  const manifestPath = join(appDirectory, 'package.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

  manifest.devDependencies = { ...manifest.devDependencies, ...dependencies }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
}

async function startVite() {
  const viteBin = join(PKG, 'node_modules', '.bin', 'vite')
  const vite = spawn(
    viteBin,
    [join('harness', 'web'), '--port', String(VITE_PORT), '--strictPort'],
    {
      cwd: PKG,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )

  vite.stdout.on('data', (chunk) => process.stdout.write(`[vite] ${chunk}`))
  vite.stderr.on('data', (chunk) => process.stderr.write(`[vite] ${chunk}`))

  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/records`)

      if (response.ok) {
        return vite
      }
    } catch {
      // Not up yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  vite.kill()

  throw new Error(`the vite harness never answered at ${BASE_URL}/records`)
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  const platform = options.platform

  requireBuild()

  const benchmark = await import(pathToFileURL(join(PKG, 'dist', 'index.js')).href)
  const {
    CaptureUnavailableError,
    DEVICE_HARNESS_DEPENDENCIES,
    ScenarioRunError,
    captureNativeDevice,
    captureWebChrome,
    runScenario,
    validateScenario,
    writeDeviceHarness,
  } = benchmark

  const issues = validateScenario(RECORDS_SCENARIO)

  if (issues.length > 0) {
    for (const issue of issues) {
      process.stderr.write(`${issue.path}: ${issue.message}\n`)
    }

    process.exit(2)
  }

  step(`Prepare the fixture application (${platform})`)

  const { workspace, artifactsDir } =
    options.workspace === undefined
      ? newWorkspace('navirox-capture-')
      : namedWorkspace(options.workspace)
  let vite

  try {
    const packages = publishablePackages()

    const artifacts = pack(artifactsDir, packages)

    const appDirectory = scaffold(join(workspace, 'app'))

    const screen = await installGeneratedScreen(appDirectory)

    step('Install the device harness')

    addHarnessDependencies(appDirectory, DEVICE_HARNESS_DEPENDENCIES)
    writeDeviceHarness(appDirectory)

    consumeFromArtifacts(appDirectory, artifacts)
    install(appDirectory)
    assertInstalledFromArtifacts(appDirectory, packages)
    assertSingleRuntime(appDirectory)

    if (platform === 'ios') {
      installIosPods(appDirectory)
    }

    step('Capture the scenarios')

    vite = await startVite()

    const name = deviceName(platform)
    const device = { platform, deviceName: name }
    const otherPlatform = PLATFORMS.find((candidate) => candidate !== platform)
    const failures = []

    for (const scenarioName of options.scenarios) {
      const scenario = SCENARIOS.find((entry) => entry.name === scenarioName)
      const scenarioPath = join(appDirectory, 'e2e', `${scenario.name}.json`)

      writeFileSync(scenarioPath, `${JSON.stringify(scenario, null, 2)}\n`, 'utf8')

      step(`Capture ${scenario.name} on ${platform}`)

      const other = (_scenario, capture) => {
        throw new CaptureUnavailableError(
          capture.key,
          `the run prepared one platform, so the ${otherPlatform} capture is recorded unavailable rather than guessed`,
        )
      }

      const artifactDirectory = join(appDirectory, 'scenario-artifacts', scenario.name)

      let report

      try {
        report = runScenario(
          scenario,
          {
            web: (scenario, capture, outPath) =>
              captureWebChrome(scenario, capture, outPath, {
                chromePath: CHROME_PATH,
                baseUrl: BASE_URL,
              }),
            native: {
              [platform]: (scenario, capture, outPath) =>
                captureNativeDevice(scenario, capture, outPath, {
                  platform,
                  appDirectory,
                  binaryPath: binaryPath(appDirectory, platform),
                  deviceName: name,
                  scenarioPath,
                  rootTestId: ROOT_TEST_ID,
                  artifactDirectory,
                }),
              [otherPlatform]: other,
            },
          },
          artifactDirectory,
          {
            screen: { compilerVersion: screen.compilerVersion, manifestHash: screen.manifestHash },
            devices: { [platform]: device },
          },
        )
      } catch (error) {
        if (!(error instanceof ScenarioRunError)) {
          throw error
        }

        report = error.report
      }

      const missing = report.outcomes
        .flatMap((outcome) => [
          existsSync(join(artifactDirectory, `${outcome.capture}.web.png`))
            ? undefined
            : `${outcome.capture}.web`,
          existsSync(join(artifactDirectory, `${outcome.capture}.${platform}.png`))
            ? undefined
            : `${outcome.capture}.${platform}`,
        ])
        .filter((entry) => entry !== undefined)

      const frames = report.outcomes.flatMap((outcome) => {
        const path = join(artifactDirectory, `${outcome.capture}.${platform}.png`)

        if (!existsSync(path)) {
          return []
        }

        const bytes = readFileSync(path)

        return [
          {
            key: outcome.capture,
            moment: outcome.moment,
            file: `${outcome.capture}.${platform}.png`,
            bytes: bytes.length,
            sha256: digest(path),
          },
        ]
      })

      const labels = report.motion.labels
      const expectedLabels = report.motion.declared
        ? report.motion.interruptible
          ? MOTION_ORDER
          : MOTION_ORDER.slice(0, 4)
        : labels
      const labelsInOrder =
        labels.length === expectedLabels.length &&
        expectedLabels.every((moment, index) => labels[index] === moment)

      const byHash = new Map()

      for (const frame of frames) {
        const group = byHash.get(frame.sha256) ?? []

        group.push(frame.key)
        byHash.set(frame.sha256, group)
      }

      const coincidentFrames = [...byHash.values()]
        .filter((group) => group.length > 1)
        .map((group) => group.join(' and '))

      const evidence = {
        scenario: scenario.name,
        platform,
        artifactDirectory,
        device,
        screen: {
          compilerVersion: screen.compilerVersion,
          manifestHash: screen.manifestHash,
        },
        motion: report.motion,
        labels,
        labelsInOrder,
        frames,
        coincidentFrames,
        missing,
        unavailable: report.outcomes.flatMap((outcome) =>
          outcome.unavailable.map((entry) => ({
            capture: outcome.capture,
            platform: entry.platform,
            reason: entry.reason,
          })),
        ),
        report,
        commands: [
          `node packages/visual-benchmark/scripts/capture-records-native.mjs --platform ${platform} --scenario ${scenario.name}`,
        ],
        notes: [
          'The device capture comes from the application the target compiler emitted; the emitted screen file is recompiled and compared before anything is installed.',
          'A frame is a state of the fixture, not a claim of visual parity: the comparison stays a measurement until a scenario declares a cross-platform tolerance.',
          'The fixture application replaces the template root screen, so the captured screen carries no safe-area padding. That is a property of the fixture, not of the platform.',
        ],
      }

      mkdirSync(EVIDENCE_DIRECTORY, { recursive: true })

      const evidencePath = join(
        EVIDENCE_DIRECTORY,
        `records-native-capture-${scenario.name}-${platform}.json`,
      )

      writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8')

      process.stdout.write(`\nReport: ${evidencePath}\n`)
      process.stdout.write(`Device: ${name} (${platform})\n`)
      process.stdout.write(`Labels: ${labels.join(', ')}\n`)

      for (const frame of frames) {
        process.stdout.write(`  ${frame.file} ${frame.bytes} bytes ${frame.sha256}\n`)
      }

      if (coincidentFrames.length > 0) {
        process.stdout.write(`Coincident frames: ${coincidentFrames.join('; ')}\n`)
      }

      for (const entry of evidence.unavailable) {
        process.stdout.write(`Unavailable: ${entry.capture}.${entry.platform} (${entry.reason})\n`)
      }

      if (missing.length > 0) {
        failures.push(
          `${scenario.name}: a capture this run asked for is missing: ${missing.join(', ')}`,
        )
      }

      if (!labelsInOrder) {
        failures.push(
          `${scenario.name}: the motion labels are not in the required order: ${labels.join(', ')}`,
        )
      }
    }

    assert(failures.length === 0, failures.join('; '))

    process.stdout.write(`\nDone. Workspace: ${workspace}\n`)
  } finally {
    if (vite !== undefined) {
      vite.kill()
    }

    if (!options.keep && options.workspace === undefined) {
      removeWorkspace(workspace, artifactsDir)
    }
  }
}

main().catch((error) => {
  process.stderr.write(`capture failed: ${error.message}\n`)
  process.exit(1)
})
