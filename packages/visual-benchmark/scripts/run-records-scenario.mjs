#!/usr/bin/env node
/**
 * Run the records-list fixture scenario: serve the web harness with vite,
 * capture the web moment with headless Chrome, attempt both native captures
 * (recorded unavailable without a device pipeline), and persist the
 * per-capture report to docs/evidence/records-scenario-report.json.
 *
 * Exits 0 when every capture exists, 1 when any capture is missing. The
 * report is written in both cases so absences stay visible.
 */
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG = join(HERE, '..')
const REPO = join(PKG, '..', '..')
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 5199

const { validateScenario } = await import(join(PKG, 'dist', 'scenario.js'))
const { captureNativeDevice, captureWebChrome } = await import(join(PKG, 'dist', 'drivers.js'))
const { ScenarioRunError, runScenario } = await import(join(PKG, 'dist', 'run.js'))

const scenario = {
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
          ios: (s, capture, outPath) =>
            captureNativeDevice(s, capture, outPath, { platform: 'ios' }),
          android: (s, capture, outPath) =>
            captureNativeDevice(s, capture, outPath, { platform: 'android' }),
        },
      },
      artifactDir,
    )
  } catch (error) {
    if (!(error instanceof ScenarioRunError)) throw error
    report = error.report
    exitCode = 1
  }
  const reportPath = join(REPO, 'docs', 'evidence', 'records-scenario-report.json')
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`Report: ${reportPath}`)
  console.log(JSON.stringify(report, null, 2))
} finally {
  vite.kill()
}
process.exit(exitCode)
