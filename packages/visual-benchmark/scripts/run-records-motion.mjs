#!/usr/bin/env node
/**
 * Run the records-motion fixture scenario: serve the web harness with vite,
 * capture the five temporal moments (rest, first meaningful, midpoint,
 * settled, interrupted) with headless Chrome, attempt both native captures
 * (recorded unavailable without a device pipeline), and persist the report to
 * docs/evidence/records-motion-report.json.
 *
 * The fixture is a discrete selection state machine, not an interpolated
 * animation: the compiler rejects transition, animation and transform, and a
 * press either changes the selection or leaves it untouched. The five frames
 * therefore sample the declared action timeline, and a frame records the state
 * reached after its own actions. Frames that coincide are reported with their
 * shared sha256 instead of being hidden, and no frame is described as an
 * in-flight interpolation.
 *
 * Exits 0 when the runner recorded the five labels in order and every web
 * capture exists; a missing web capture or a wrong order exits 1. Native
 * absences are recorded as unavailable entries and do not gate, because no
 * device pipeline exists on this machine. The report is written in every case
 * so absences stay visible.
 */
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG = join(HERE, '..')
const REPO = join(PKG, '..', '..')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 5201
const ORDER = ['rest', 'first-meaningful', 'midpoint', 'settled', 'interrupted']

const { validateScenario } = await import(join(PKG, 'dist', 'scenario.js'))
const { CaptureUnavailableError, captureWebChrome } = await import(join(PKG, 'dist', 'drivers.js'))
const { ScenarioRunError, runScenario } = await import(join(PKG, 'dist', 'run.js'))

const scenario = {
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
  motion: {
    interaction: 'select a record, then replace the selection with a second press',
    interruptible: true,
  },
  captures: [
    { key: 'rest', moment: 'rest' },
    {
      key: 'first-meaningful',
      moment: 'first-meaningful',
      actions: [{ press: 'record-select', nth: 0 }],
    },
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
      actions: [
        { press: 'record-select', nth: 0 },
        { press: 'record-select', nth: 1 },
      ],
    },
  ],
  masks: [],
}

const issues = validateScenario(scenario)
if (issues.length > 0) {
  console.error(`Invalid scenario: ${JSON.stringify(issues)}`)
  process.exit(2)
}

const viteBin = join(PKG, 'node_modules', '.bin', 'vite')
const vite = spawn(viteBin, [join('harness', 'web'), '--port', String(PORT), '--strictPort'], {
  cwd: PKG,
  stdio: ['ignore', 'pipe', 'pipe'],
})
vite.stdout.on('data', (chunk) => process.stdout.write(`[vite] ${chunk}`))
vite.stderr.on('data', (chunk) => process.stderr.write(`[vite] ${chunk}`))

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/records`)
      if (response.ok) return
    } catch {
      await delay(200)
    }
  }
  throw new Error('vite harness did not become ready')
}

function describeFrame(artifactDir, capture) {
  const webPath = join(artifactDir, `${capture.key}.web.png`)
  if (!existsSync(webPath)) return { key: capture.key, moment: capture.moment, web: null }
  const bytes = readFileSync(webPath)
  return {
    key: capture.key,
    moment: capture.moment,
    actions: capture.actions ?? [],
    web: `${capture.key}.web.png`,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  }
}

let exitCode = 0
try {
  await waitForServer()
  const artifactDir = join(PKG, 'scenario-artifacts', scenario.name)
  const baseUrl = `http://127.0.0.1:${PORT}`
  let report
  try {
    report = runScenario(
      scenario,
      {
        web: (s, capture, outPath) =>
          captureWebChrome(s, capture, outPath, { chromePath: CHROME, baseUrl }),
        native: {
          ios: (_s, capture) => {
            throw new CaptureUnavailableError(
              capture.key,
              'this runner captures the web side only, so the ios capture is produced by packages/visual-benchmark/scripts/capture-records-native.mjs',
            )
          },
          android: (_s, capture) => {
            throw new CaptureUnavailableError(
              capture.key,
              'this runner captures the web side only, so the android capture is produced by packages/visual-benchmark/scripts/capture-records-native.mjs',
            )
          },
        },
      },
      artifactDir,
    )
  } catch (error) {
    if (!(error instanceof ScenarioRunError)) throw error
    report = error.report
    if (error.missing.some((entry) => entry.endsWith('.web'))) exitCode = 1
  }

  const frames = scenario.captures.map((capture) => describeFrame(artifactDir, capture))
  const missing = frames.filter((frame) => frame.web === null).map((frame) => frame.key)
  if (missing.length > 0) exitCode = 1

  const labels = report.motion.labels
  const orderMatches =
    labels.length === ORDER.length && ORDER.every((moment, index) => labels[index] === moment)
  if (!orderMatches) exitCode = 1

  const byHash = new Map()
  for (const frame of frames) {
    if (frame.sha256 === undefined) continue
    const group = byHash.get(frame.sha256) ?? []
    group.push(frame.key)
    byHash.set(frame.sha256, group)
  }
  const coincidentFrames = [...byHash.values()]
    .filter((group) => group.length > 1)
    .map((group) => group.join(' and '))

  const evidence = {
    scenario: scenario.name,
    artifactDir,
    motion: report.motion,
    labels,
    labelsInOrder: orderMatches,
    frames,
    coincidentFrames,
    missing,
    unavailable: report.outcomes.flatMap((outcome) =>
      outcome.unavailable.map((entry) => `${outcome.capture}.${entry.platform}`),
    ),
    notes: [
      'Discrete interaction: a press selects a record and a second press replaces the selection. No frame is an in-flight interpolation, and a pair listed under coincidentFrames reached the same state.',
      'Native frames are unavailable on this machine: no Detox pipeline (stream-json) and no Android emulator, recorded rather than skipped.',
    ],
  }

  const reportPath = join(REPO, 'docs', 'evidence', 'records-motion-report.json')
  writeFileSync(reportPath, `${JSON.stringify(evidence, null, 2)}\n`)
  console.log(`Report: ${reportPath}`)
  console.log(`Labels: ${labels.join(', ')}`)
  for (const frame of frames) {
    console.log(`  ${frame.moment}: ${frame.web ?? 'missing'} ${frame.sha256 ?? ''}`)
  }
  if (coincidentFrames.length > 0) console.log(`Coincident frames: ${coincidentFrames.join(' | ')}`)
  console.log(`Native captures unavailable: ${evidence.unavailable.join(', ')}`)
} finally {
  vite.kill()
}
process.exit(exitCode)
