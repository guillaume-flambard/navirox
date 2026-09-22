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
// The packager port is not free to choose: the harness Detox configuration
// reverses 8081 into the device and a debug application asks for its script
// there.
const PACKAGER_PORT = 8081
const BUNDLE_TIMEOUT_MS = 10 * 60_000
const ROOT_TEST_ID = 'records-screen'
const PLATFORMS = ['ios', 'android']
const MOTION_ORDER = ['rest', 'first-meaningful', 'midpoint', 'settled', 'interrupted']

// The differences these scenarios accept across platforms. The identifiers are
// the ones every capture of these scenarios renders, so a capture whose screen
// did not render fails instead of reaching the comparison, and the grid
// tolerance is declared because the emulator screen does not normalize to the
// browser's grid exactly (1080x2400 against 390x844 viewport).
const SCENARIO_TOLERANCE = {
  gridSize: 0.05,
  identifiers: ['records-screen', 'records-list', 'record-row', 'record-select'],
}

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
  tolerance: SCENARIO_TOLERANCE,
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
  tolerance: SCENARIO_TOLERANCE,
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

// The size a capture reduces to when both sides are normalized the same way.
// The tolerance compares these sizes, because a raw pixel difference between a
// browser and a device describes the two profiles rather than the screen. The
// decoders are passed in because the benchmark modules are imported inside the
// run, where they are only reachable through the dynamic import.
function gridOf(decoders, path) {
  const normalized = decoders.normalizeImage(decoders.decodePng(readFileSync(path)))

  return { width: normalized.width, height: normalized.height }
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

// The packager is started once for the whole run and the bundle is requested
// before any capture. Detox starts its own packager per invocation, and a cold
// packager bundles every module on the first request, so each of the six
// captures used to wait for a bundle the application gave up on. Warming it
// here also makes the captures themselves much shorter.
async function startPackager(appDirectory, platform) {
  const packager = spawn(
    join(appDirectory, 'node_modules', '.bin', 'react-native'),
    ['start', '--port', String(PACKAGER_PORT)],
    {
      cwd: appDirectory,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )

  packager.stdout.on('data', (chunk) => process.stdout.write(`[metro] ${chunk}`))
  packager.stderr.on('data', (chunk) => process.stderr.write(`[metro] ${chunk}`))

  const status = `http://127.0.0.1:${PACKAGER_PORT}/status`

  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(status)

      if (response.ok) {
        break
      }
    } catch {
      // Not up yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 300))
  }

  const bundle = `http://127.0.0.1:${PACKAGER_PORT}/index.bundle?platform=${platform}&dev=true&minify=false`
  const started = Date.now()

  for (;;) {
    if (Date.now() - started > BUNDLE_TIMEOUT_MS) {
      packager.kill()

      throw new Error(`the packager never bundled index.bundle for ${platform}`)
    }

    try {
      const response = await fetch(bundle)

      if (response.ok) {
        await response.arrayBuffer()

        process.stdout.write(`[metro] bundled index.bundle for ${platform}\n`)

        return packager
      }
    } catch {
      // Still bundling.
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
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
    decodePng,
    evaluateTolerance,
    normalizeImage,
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
  let packager

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

    packager = await startPackager(appDirectory, platform)
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
                identifiers: scenario.tolerance?.identifiers,
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
                  identifiers: scenario.tolerance?.identifiers,
                  artifactDirectory,
                  skipStart: true,
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

      // The tolerance this run is evaluated against. It is declared per
      // scenario, and a scenario that declares none keeps the measurement-only
      // behaviour: there is nothing declared to pass or fail against.
      const toleranceRun =
        scenario.tolerance === undefined
          ? undefined
          : {
              scenario: scenario.name,
              tolerance: scenario.tolerance,
              platforms: [platform],
              captures: report.outcomes.map((outcome) => {
                const webPath = join(artifactDirectory, `${outcome.capture}.web.png`)
                const devicePath = join(artifactDirectory, `${outcome.capture}.${platform}.png`)
                const sides = [
                  existsSync(webPath) ? 'web' : undefined,
                  existsSync(devicePath) ? platform : undefined,
                ].filter((side) => side !== undefined)

                let grid

                if (existsSync(webPath) && existsSync(devicePath)) {
                  try {
                    grid = {
                      web: gridOf({ normalizeImage, decodePng }, webPath),
                      device: gridOf({ normalizeImage, decodePng }, devicePath),
                    }
                  } catch (error) {
                    process.stderr.write(
                      `the grid of ${outcome.capture} could not be read: ${error.message}\n`,
                    )
                  }
                }

                return { key: outcome.capture, produced: sides, grid }
              }),
              identifiers: (scenario.tolerance.identifiers ?? []).map((identifier) => ({
                name: identifier,
                // A capture only succeeds once its driver found every declared
                // identifier, so a capture that exists is an assertion that the
                // identifier was rendered there.
                asserted: [
                  ...new Set(
                    report.outcomes.flatMap((outcome) =>
                      [
                        existsSync(join(artifactDirectory, `${outcome.capture}.web.png`))
                          ? 'web'
                          : undefined,
                        existsSync(join(artifactDirectory, `${outcome.capture}.${platform}.png`))
                          ? platform
                          : undefined,
                      ].filter((side) => side !== undefined),
                    ),
                  ),
                ],
              })),
              motion: report.motion.declared
                ? { declared: true, required: expectedLabels, labels }
                : undefined,
            }

      const verdict = toleranceRun === undefined ? undefined : evaluateTolerance(toleranceRun)

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
        tolerance: scenario.tolerance ?? null,
        verdict: verdict ?? null,
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
          'A frame is a state of the fixture, not a claim of visual parity: the verdict above is the declared tolerance being evaluated, and the pixel difference ratio is a measurement reported beside it rather than the value that decides it.',
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

      if (verdict !== undefined) {
        process.stdout.write(`Verdict: ${verdict.verdict}\n`)

        for (const check of verdict.checks) {
          process.stdout.write(`  ${check.verdict} ${check.name}: ${check.detail}\n`)
        }
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

      if (verdict !== undefined && verdict.verdict === 'fail') {
        failures.push(
          `${scenario.name}: the declared tolerance failed at ${verdict.decidedBy ?? 'a check'}`,
        )
      }
    }

    assert(failures.length === 0, failures.join('; '))

    process.stdout.write(`\nDone. Workspace: ${workspace}\n`)
  } finally {
    if (vite !== undefined) {
      vite.kill()
    }

    if (packager !== undefined) {
      packager.kill()
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
