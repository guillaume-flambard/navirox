#!/usr/bin/env node
/**
 * Prove the comparison gate on real captured pixels.
 *
 * The unit tests say what the measurement code does with synthetic images.
 * This script proves the gate itself on pixels a browser actually produced:
 *
 *   1. two real renders of one screen under the same conditions agree
 *   2. an undeclared difference against a controlled variant fails
 *   3. the same difference inside a declared mask is reported, not failed
 *
 * It also measures a 2x device scale render against the 1x render and records
 * the outcome without gating on it: normalization does not equalize device
 * scale factors, and pretending otherwise would be a false parity claim.
 *
 * It writes review pages and a JSON record under
 * packages/visual-benchmark/scenario-artifacts/ and docs/evidence/. Binary
 * artifacts stay git-ignored; the JSON record is the committed evidence.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

const HERE = dirname(fileURLToPath(import.meta.url))
const PKG = join(HERE, '..')
const ROOT = join(PKG, '..', '..')
const PORT = 5200
const BASE_URL = `http://127.0.0.1:${PORT}`
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const require = createRequire(import.meta.url)
const { captureWebChrome } = require(join(PKG, 'dist', 'drivers.js'))
const { compareImages, decodePng, encodePng, writeComparisonReview } = require(
  join(PKG, 'dist', 'measure.js'),
)

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
const capture = scenario.captures[0]

const artifactDir = join(PKG, 'scenario-artifacts', scenario.name)
rmSync(artifactDir, { recursive: true, force: true })
mkdirSync(artifactDir, { recursive: true })

const paintBlock = (image, block) => {
  const data = Buffer.from(image.data)
  for (let y = block.y; y < block.y + block.height; y += 1) {
    for (let x = block.x; x < block.x + block.width; x += 1) {
      const at = (y * image.width + x) * 4
      data[at] = 255
      data[at + 1] = 0
      data[at + 2] = 255
      data[at + 3] = 255
    }
  }
  return { width: image.width, height: image.height, data }
}

const startVite = () => {
  const viteBin = join(PKG, 'node_modules', '.bin', 'vite')
  const child = spawn(viteBin, [join('harness', 'web'), '--port', String(PORT), '--strictPort'], {
    cwd: PKG,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let log = ''
  child.stdout.on('data', (chunk) => {
    log += String(chunk)
  })
  child.stderr.on('data', (chunk) => {
    log += String(chunk)
  })
  return { child, log: () => log }
}

const waitForServer = async (url, attempts = 50) => {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return
      }
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 200))
  }
  throw new Error(`server at ${url} did not answer`)
}

const record = {
  scenario: scenario.name,
  artifactDir,
  cases: [],
  strict: true,
}

const expect = (condition, message) => {
  if (!condition) {
    throw new Error(`expectation failed: ${message}`)
  }
}

const addCase = (entry) => {
  record.cases.push(entry)
  return entry
}

const vite = startVite()
let failure
try {
  await waitForServer(`${BASE_URL}/records`)

  const oneX = join(artifactDir, 'rest.1x.png')
  const repeatX = join(artifactDir, 'rest.1x.repeat.png')
  const twoX = join(artifactDir, 'rest.2x.png')
  captureWebChrome(scenario, capture, oneX, {
    chromePath: CHROME_PATH,
    baseUrl: BASE_URL,
    deviceScaleFactor: 1,
  })
  captureWebChrome(scenario, capture, repeatX, {
    chromePath: CHROME_PATH,
    baseUrl: BASE_URL,
    deviceScaleFactor: 1,
  })
  captureWebChrome(scenario, capture, twoX, {
    chromePath: CHROME_PATH,
    baseUrl: BASE_URL,
    deviceScaleFactor: 2,
  })

  const base = decodePng(readFileSync(oneX))
  const repeat = decodePng(readFileSync(repeatX))
  const scaled = decodePng(readFileSync(twoX))
  expect(scaled.width === base.width * 2, 'the 2x render is twice as wide as the 1x render')

  const realPair = compareImages('rest.1x', base, 'rest.1x.repeat', repeat)
  addCase({
    name: 'two renders of one screen under the same conditions',
    a: 'rest.1x.png',
    b: 'rest.1x.repeat.png',
    masks: [],
    gating: true,
    verdict: realPair.verdict,
    differingPixels: realPair.differingPixels,
    maskedDifferingPixels: realPair.maskedDifferingPixels,
    unmaskedDifferingPixels: realPair.unmaskedDifferingPixels,
    boundingBox: realPair.boundingBox,
  })
  expect(
    realPair.verdict === 'identical',
    `two renders of one screen agree after normalization, got ${realPair.verdict}`,
  )

  const crossScale = compareImages('rest.1x', base, 'rest.2x', scaled)
  addCase({
    name: 'a second render at device scale 2',
    a: 'rest.1x.png',
    b: 'rest.2x.png',
    masks: [],
    gating: false,
    note: 'Normalization does not equalize device scale factors: text rasterization at 2x differs from 1x, so this pair is measured and recorded but does not gate.',
    verdict: crossScale.verdict,
    differingPixels: crossScale.differingPixels,
    maskedDifferingPixels: crossScale.maskedDifferingPixels,
    unmaskedDifferingPixels: crossScale.unmaskedDifferingPixels,
    boundingBox: crossScale.boundingBox,
  })

  const block = { x: 40, y: 120, width: 60, height: 40 }
  const variant = paintBlock(base, block)
  const variantPath = join(artifactDir, 'rest.variant.png')
  writeFileSync(variantPath, encodePng(variant))

  const undeclared = compareImages('rest.1x', base, 'rest.variant', variant)
  const undeclaredReview = join(artifactDir, 'review-undeclared', 'index.html')
  mkdirSync(dirname(undeclaredReview), { recursive: true })
  cpSync(oneX, join(dirname(undeclaredReview), 'a.png'))
  cpSync(variantPath, join(dirname(undeclaredReview), 'b.png'))
  const undeclaredPaths = writeComparisonReview(
    undeclared,
    base,
    variant,
    [],
    {},
    undeclaredReview,
    'a.png',
    'b.png',
  )
  addCase({
    name: 'undeclared difference against a controlled variant',
    a: 'rest.1x.png',
    b: 'rest.variant.png',
    masks: [],
    gating: true,
    verdict: undeclared.verdict,
    differingPixels: undeclared.differingPixels,
    maskedDifferingPixels: undeclared.maskedDifferingPixels,
    unmaskedDifferingPixels: undeclared.unmaskedDifferingPixels,
    boundingBox: undeclared.boundingBox,
    review: undeclaredPaths.html,
  })
  expect(
    undeclared.verdict === 'undeclared-differences',
    `a difference outside every mask fails, got ${undeclared.verdict}`,
  )
  expect(undeclared.unmaskedDifferingPixels > 0, 'the undeclared case counts the differing pixels')

  const mask = {
    captures: [capture.key],
    x: block.x,
    y: block.y,
    width: block.width,
    height: block.height,
    reason: 'controlled comparison variant painted into the capture',
  }
  const masked = compareImages('rest.1x', base, 'rest.variant', variant, [mask])
  const maskedReview = join(artifactDir, 'review-masked', 'index.html')
  mkdirSync(dirname(maskedReview), { recursive: true })
  cpSync(oneX, join(dirname(maskedReview), 'a.png'))
  cpSync(variantPath, join(dirname(maskedReview), 'b.png'))
  const maskedPaths = writeComparisonReview(
    masked,
    base,
    variant,
    [mask],
    {},
    maskedReview,
    'a.png',
    'b.png',
  )
  addCase({
    name: 'the same difference inside a declared mask',
    a: 'rest.1x.png',
    b: 'rest.variant.png',
    masks: [mask],
    gating: true,
    verdict: masked.verdict,
    differingPixels: masked.differingPixels,
    maskedDifferingPixels: masked.maskedDifferingPixels,
    unmaskedDifferingPixels: masked.unmaskedDifferingPixels,
    boundingBox: masked.boundingBox,
    review: maskedPaths.html,
  })
  expect(
    masked.verdict === 'masked-differences',
    `a difference inside a declared mask is reported, got ${masked.verdict}`,
  )
  expect(masked.unmaskedDifferingPixels === 0, 'the masked case leaves no unmasked difference')

  record.chrome = { oneX, repeatX, twoX, variant: variantPath }
  record.commands = [
    'node packages/visual-benchmark/scripts/run-records-scenario.mjs',
    'node packages/visual-benchmark/scripts/compare-records-scenario.mjs',
  ]
} catch (error) {
  failure = error
  record.error = String(error && error.message ? error.message : error)
} finally {
  vite.child.kill('SIGTERM')
}

const outDir = join(ROOT, 'docs', 'evidence')
mkdirSync(outDir, { recursive: true })
const outPath = join(outDir, 'records-scenario-comparison.json')
writeFileSync(outPath, `${JSON.stringify(record, null, 2)}\n`)

for (const entry of record.cases) {
  console.log(`${entry.verdict.padEnd(24)} ${entry.name}`)
}
if (failure) {
  console.error(`comparison failed: ${failure.message}`)
  console.error(`record written to ${outPath}`)
  process.exit(1)
}
if (!existsSync(outPath)) {
  console.error('record missing')
  process.exit(1)
}
console.log(`comparison record written to ${outPath}`)
process.exit(0)
