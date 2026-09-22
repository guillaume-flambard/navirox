#!/usr/bin/env node
/**
 * Captures the Angular proof companion on a device.
 *
 * The journey has no served web page and no target compiler, so there is no web
 * capture to compare with: this run records what the companion shows on a device
 * and states that no web counterpart exists. It prepares the companion from the
 * fixture record (the planner-approved module copied byte for byte beside the
 * hand-written screen), installs the device harness, drives the declared action
 * sequence and writes one screenshot per capture plus a provenance record.
 *
 * Usage: node scripts/capture-angular-companion.mjs [--platform ios|android] [--keep]
 *
 * Exits 0 when every declared capture exists and the record is written, 1 when a
 * declared capture is missing. Android runs in continuous integration, where the
 * emulator exists.
 */
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import {
  ANGULAR_COMPANION_FIXTURE,
  BENCHMARK,
  ROOT,
  analyzeFixture,
  assert,
  assertSingleRuntime,
  consumeFromArtifacts,
  decisionFor,
  install,
  installFixtureScreen,
  installIosPods,
  newWorkspace,
  pack,
  planFixture,
  publishablePackages,
  removeWorkspace,
  requireBuild,
  scaffold,
  sha256,
  step,
} from './lib/fixture-app.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
function provenancePath(platform) {
  return join(ROOT, 'docs', 'evidence', `angular-companion-device-evidence-${platform}.json`)
}
const PLATFORMS = ['ios', 'android']
const PACKAGER_PORT = 8081
const BUNDLE_TIMEOUT_MS = 10 * 60_000
const ROOT_TEST_ID = 'record-workflow-screen'
const SHARED_MODULE = 'record-workflow.data.ts'
const SHARED_SOURCE = join(ANGULAR_COMPANION_FIXTURE.directory, 'src', 'app', SHARED_MODULE)
const SHARED_SOURCE_PATH = `packages/source-angular/fixtures/record-workflow/src/app/${SHARED_MODULE}`
const FIXTURE_PATH = 'packages/source-angular/fixtures/record-workflow'
const BENCHMARK_REVISION = '2cd77380bc838b8bd6c80f9fbe25855d73ef860c'

const DECISIONS = [
  {
    subject: 'angular:src/app/record-workflow.data.ts:utility:default',
    classification: 'shared',
    rule: 'unit-shared-logic',
  },
  {
    subject: 'angular:src/app/record-workflow.component.ts:component:default',
    classification: 'native-replacement',
    rule: 'unit-view-layer',
  },
  {
    subject: 'angular:src/app/record-workflow.component.ts:capability:file-reading:read',
    classification: 'manual',
    rule: 'capability-no-counterpart',
  },
]

const LIMITS = [
  'The journey has no served web page, so no web capture exists and no comparison is reported.',
  'No target compiler produced the screen, so no compiler version or manifest hash is recorded.',
  'The pinned SuiteCRM routing could not be read, so no route, screen or unit is claimed.',
  'The declared @angular/core version is outside the tested range, so it stays untested.',
  'The workflow is an unvalidated hypothesis and Navirox has no affiliation with SuiteCRM.',
  'Nothing here is a visual-fidelity or parity claim.',
]

function parseArguments(argv) {
  const options = { platform: 'ios', keep: false }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]

    if (argument === '--keep') {
      options.keep = true
      continue
    }

    if (argument === '--platform') {
      options.platform = argv[index + 1]
      index += 1
      continue
    }

    throw new Error(`Unknown argument ${argument}.`)
  }

  assert(PLATFORMS.includes(options.platform), `--platform must be one of ${PLATFORMS.join(', ')}.`)

  return options
}

function deviceName(platform) {
  if (process.env.NAVIROX_DEVICE !== undefined && process.env.NAVIROX_DEVICE.length > 0) {
    return process.env.NAVIROX_DEVICE
  }

  return platform === 'ios' ? 'iPhone 17' : 'atable_pixel'
}

function applicationName(appDirectory) {
  return JSON.parse(readFileSync(join(appDirectory, 'app.json'), 'utf8')).name
}

function binaryPath(appDirectory, platform) {
  if (platform === 'ios') {
    return join(
      appDirectory,
      'ios',
      'build',
      'Build',
      'Products',
      'Debug-iphonesimulator',
      `${applicationName(appDirectory)}.app`,
    )
  }

  return join(appDirectory, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
}

function addHarnessDependencies(appDirectory, dependencies) {
  const manifestPath = join(appDirectory, 'package.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

  manifest.devDependencies = { ...manifest.devDependencies, ...dependencies }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, undefined, 2)}\n`, 'utf8')
}

function digest(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

/**
 * Starts the packager once for the whole run and warms the bundle. Detox starts
 * its own packager per invocation, and a cold packager bundles every module on
 * the first request, so each capture would wait for a bundle the application
 * gives up on.
 */
async function startPackager(appDirectory, platform) {
  const packager = spawn(
    join(appDirectory, 'node_modules', '.bin', 'react-native'),
    ['start', '--port', String(PACKAGER_PORT)],
    { cwd: appDirectory, stdio: ['ignore', 'pipe', 'pipe'] },
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

    const response = await fetch(bundle)

    if (response.ok) {
      await response.arrayBuffer()
      process.stdout.write(`[metro] bundled index.bundle for ${platform}\n`)
      return packager
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  const platform = options.platform

  requireBuild()

  const {
    ANGULAR_COMPANION_IDENTIFIERS,
    DEVICE_HARNESS_DEPENDENCIES,
    angularCompanionScenario,
    captureNativeDevice,
    writeDeviceHarness,
  } = await import(pathToFileURL(BENCHMARK).href)

  step('Reading the fixture with the source adapter')

  const analysis = analyzeFixture(ANGULAR_COMPANION_FIXTURE)

  assert(
    analysis.source?.adapterId === 'angular',
    `The adapter read this fixture as ${analysis.source?.adapterId ?? 'nothing'}, so it is not the Angular proof fixture.`,
  )

  const findings = Object.values(analysis.summary?.findings ?? {}).reduce(
    (total, count) => total + count,
    0,
  )

  assert(findings === 0, `The fixture no longer reads cleanly: ${findings} findings.`)
  process.stdout.write(
    `   ${analysis.summary.files} files, ${analysis.summary.units} units, ${analysis.summary.capabilities} capabilities, 0 findings\n`,
  )

  step('Asking the planner which units may move')

  const plan = planFixture(ANGULAR_COMPANION_FIXTURE)

  for (const expected of DECISIONS) {
    const decision = decisionFor(plan, expected.subject)

    assert(
      decision.classification === expected.classification,
      `${expected.subject} is ${decision.classification}, but the capture depends on ${expected.classification}.`,
    )
    assert(
      decision.reasons?.[0]?.ruleId === expected.rule,
      `${expected.subject} was decided by ${decision.reasons?.[0]?.ruleId ?? 'no rule'}, but the capture depends on ${expected.rule}.`,
    )

    process.stdout.write(`   ${expected.subject} -> ${decision.classification}\n`)
  }

  step(`Preparing the companion for "${ANGULAR_COMPANION_FIXTURE.appName}"`)

  const { workspace, artifactsDir } = newWorkspace('navirox-angular-companion-')
  const appDirectory = scaffold(join(workspace, 'app'), ANGULAR_COMPANION_FIXTURE.appName)
  let packager

  try {
    const screenHash = installFixtureScreen(appDirectory, ANGULAR_COMPANION_FIXTURE)

    const sharedSource = readFileSync(SHARED_SOURCE, 'utf8')

    writeFileSync(join(appDirectory, SHARED_MODULE), sharedSource, 'utf8')
    assert(
      readFileSync(join(appDirectory, SHARED_MODULE), 'utf8') === sharedSource,
      `${SHARED_MODULE} did not arrive unchanged, so the move is not the one the planner approved.`,
    )
    const moduleHash = sha256(sharedSource)

    process.stdout.write(`   moved ${SHARED_MODULE} (shared)\n`)

    step('Installing the device harness')

    addHarnessDependencies(appDirectory, DEVICE_HARNESS_DEPENDENCIES)
    writeDeviceHarness(appDirectory)

    const scenarioPath = join(appDirectory, 'e2e', 'angular-companion.json')

    mkdirSync(dirname(scenarioPath), { recursive: true })
    writeFileSync(
      scenarioPath,
      `${JSON.stringify(angularCompanionScenario, undefined, 2)}\n`,
      'utf8',
    )

    step('Installing the companion from the packed artifacts')

    const artifacts = pack(artifactsDir, publishablePackages())

    consumeFromArtifacts(appDirectory, artifacts)
    install(appDirectory)
    assertSingleRuntime(appDirectory)

    if (platform === 'ios') {
      installIosPods(appDirectory)
    }

    step('Capturing the workflow on a device')

    packager = await startPackager(appDirectory, platform)

    const name = deviceName(platform)
    const artifactDirectory = join(
      appDirectory,
      'scenario-artifacts',
      angularCompanionScenario.name,
    )

    mkdirSync(artifactDirectory, { recursive: true })

    const captures = []
    const missing = []

    for (const capture of angularCompanionScenario.captures) {
      const outPath = join(artifactDirectory, `${capture.key}.${platform}.png`)

      captureNativeDevice(angularCompanionScenario, capture, outPath, {
        platform,
        appDirectory,
        binaryPath: binaryPath(appDirectory, platform),
        deviceName: name,
        scenarioPath,
        rootTestId: ROOT_TEST_ID,
        identifiers: [...ANGULAR_COMPANION_IDENTIFIERS],
        artifactDirectory,
        skipStart: true,
      })

      if (existsSync(outPath)) {
        captures.push({
          key: capture.key,
          moment: capture.moment,
          file: `${capture.key}.${platform}.png`,
          bytes: readFileSync(outPath).length,
          sha256: digest(outPath),
          actions: capture.actions ?? [],
        })
        process.stdout.write(`   captured ${capture.moment} to ${outPath}\n`)
      } else {
        missing.push(`${capture.key}.${platform}`)
      }
    }

    const record = {
      schemaVersion: 1,
      journey: 'angular-record-workflow',
      scenario: angularCompanionScenario.name,
      platform,
      device: { platform, deviceName: name },
      source: {
        fixture: FIXTURE_PATH,
        adapterId: 'angular',
        benchmarkRevision: BENCHMARK_REVISION,
      },
      screen: {
        path: 'packages/source-angular/companion/App.vue',
        sha256: screenHash,
        producedByCompiler: false,
        note: 'The Angular journey has no target compiler, so this screen is hand-written work and no compiler version or manifest hash exists.',
      },
      consumed: {
        path: SHARED_MODULE,
        sourcePath: SHARED_SOURCE_PATH,
        sha256: moduleHash,
        decision: 'shared',
        rule: 'unit-shared-logic',
      },
      identifiers: [...ANGULAR_COMPANION_IDENTIFIERS],
      captures,
      missing,
      comparison: {
        webCounterpart: false,
        note: 'There is no served web page for this journey, so no comparison is reported.',
      },
      commands: [`node scripts/capture-angular-companion.mjs --platform ${platform}`],
      limits: LIMITS,
    }

    const recordPath = provenancePath(platform)

    mkdirSync(dirname(recordPath), { recursive: true })
    writeFileSync(recordPath, `${JSON.stringify(record, undefined, 2)}\n`, 'utf8')

    process.stdout.write(`\nRecord: ${recordPath}\n`)
    process.stdout.write(`Device: ${name} (${platform})\n`)

    for (const capture of captures) {
      process.stdout.write(`   ${capture.file} ${capture.bytes} bytes ${capture.sha256}\n`)
    }

    assert(missing.length === 0, `a capture this run asked for is missing: ${missing.join(', ')}`)

    process.stdout.write(`\nDone. Workspace: ${workspace}\n`)
  } finally {
    if (packager !== undefined) {
      packager.kill()
    }

    if (!options.keep) {
      removeWorkspace(workspace, artifactsDir)
    }
  }
}

main().catch((error) => {
  process.stderr.write(`angular companion capture failed: ${error.message}\n`)
  process.exit(1)
})
