/**
 * Proof artifact governance.
 *
 * Declares the artifacts this repository publishes as proof and the hygiene
 * rules that keep them free of credentials, unapproved fixture data and
 * undeclared assets. The table here is the machine-readable twin of the
 * declared-artifact table in docs/PROOF-ARTIFACTS.md, and the test in
 * packages/visual-benchmark/src/proof-artifacts.test.ts fails when the two
 * drift apart.
 *
 * Findings never carry the matched value: a report says which artifact class
 * and which rule fired, so a failure can be discussed without spreading the
 * value it caught.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))

export const REPOSITORY_ROOT = join(HERE, '..', '..')

export const MANIFEST = [
  {
    path: 'docs/evidence/native-capture-field-workflow-ios.json',
    provenance: 'node packages/visual-benchmark/scripts/capture-records-native.mjs --platform ios',
    purpose: 'report',
    dataClass: 'measurement',
  },
  {
    path: 'docs/evidence/native-capture-field-workflow-android.json',
    provenance: 'the CI capture job of run 35729980890',
    purpose: 'report',
    dataClass: 'measurement',
  },
  {
    path: 'docs/evidence/angular-companion-device-evidence-ios.json',
    provenance: 'node scripts/capture-angular-companion.mjs --platform ios',
    purpose: 'report',
    dataClass: 'measurement',
  },
  {
    path: 'docs/evidence/angular-companion.provenance.json',
    provenance: 'node scripts/build-angular-companion.mjs',
    purpose: 'evidence',
    dataClass: 'measurement',
  },
  {
    path: 'docs/evidence/vue-companion-assembly.provenance.json',
    provenance: 'node scripts/build-field-workflow-companion.mjs',
    purpose: 'evidence',
    dataClass: 'measurement',
  },
  {
    path: 'docs/evidence/workflow-baserow-field-work.md',
    provenance: 'pnpm test:benchmarks -- --project baserow',
    purpose: 'report',
    dataClass: 'source-derived',
  },
  {
    path: 'docs/evidence/workflow-suitecrm-record-workflow.md',
    provenance: 'pnpm test:benchmarks -- --project suitecrm',
    purpose: 'report',
    dataClass: 'source-derived',
  },
  {
    path: 'docs/evidence/records-scenario-report.json',
    provenance: 'node packages/visual-benchmark/scripts/run-records-scenario.mjs',
    purpose: 'report',
    dataClass: 'measurement',
  },
  {
    path: 'docs/evidence/records-motion-report.json',
    provenance: 'node packages/visual-benchmark/scripts/run-records-motion.mjs',
    purpose: 'report',
    dataClass: 'measurement',
  },
  {
    path: 'docs/evidence/records-scenario-comparison.json',
    provenance: 'node packages/visual-benchmark/scripts/compare-records-scenario.mjs',
    purpose: 'report',
    dataClass: 'measurement',
  },
  {
    path: 'packages/target-vue/fixtures/field-workflow/site-photo.svg',
    provenance: 'drawn for this project',
    purpose: 'asset',
    dataClass: 'original-asset',
  },
  {
    path: 'packages/source-angular/fixtures/record-workflow/src/app/site-photo.svg',
    provenance: 'drawn for this project',
    purpose: 'asset',
    dataClass: 'original-asset',
  },
  {
    path: 'packages/target-vue/fixtures/field-workflow/fieldRecords.ts',
    provenance: 'invented for this project',
    purpose: 'fixture',
    dataClass: 'synthetic',
  },
  {
    path: 'packages/source-angular/fixtures/record-workflow/src/app/record-workflow.data.ts',
    provenance: 'invented for this project',
    purpose: 'fixture',
    dataClass: 'synthetic',
  },
]

export const PROOF_PATH_PREFIXES = [
  'docs/evidence',
  'packages/target-vue/fixtures',
  'packages/source-angular/fixtures',
]

export const MANIFEST_DOCUMENT = 'docs/PROOF-ARTIFACTS.md'

const ASSET_EXTENSIONS = new Set([
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.icns',
  '.pdf',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.mp4',
  '.mov',
  '.zip',
])

const DATA_EXTENSIONS = new Set(['.csv', '.sql', '.xlsx', '.xls', '.env', '.ndjson'])

const TEXT_EXTENSIONS = new Set([
  '.json',
  '.md',
  '.txt',
  '.ts',
  '.js',
  '.mjs',
  '.cjs',
  '.vue',
  '.html',
  '.css',
  '.svg',
  '.yml',
  '.yaml',
])

const MAX_TEXT_BYTES = 1024 * 1024

export const CREDENTIAL_RULES = [
  { rule: 'private-key-block', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { rule: 'cloud-access-key', pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { rule: 'bearer-token', pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}/ },
  { rule: 'jwt-shape', pattern: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/ },
  {
    rule: 'secret-assignment',
    pattern:
      /\b(?:api[_-]?key|secret|token|password|passwd|private[_-]?key)\b\s*[:=]\s*['"][^'"\s]{8,}['"]/i,
  },
]

const FIXTURE_SEGMENT = /(^|\/)fixtures\//

function extensionOf(path) {
  const dot = path.lastIndexOf('.')
  return dot === -1 ? '' : path.slice(dot).toLowerCase()
}

function walk(root, relativeDirectory, collected) {
  const absolute = join(root, relativeDirectory)
  if (!existsSync(absolute)) return collected
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    const child = `${relativeDirectory}/${entry.name}`
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue
      walk(root, child, collected)
    } else if (entry.isFile()) {
      collected.push(child)
    }
  }
  return collected
}

export function discoverProofFiles({
  root = REPOSITORY_ROOT,
  prefixes = PROOF_PATH_PREFIXES,
} = {}) {
  const collected = []
  for (const prefix of prefixes) walk(root, prefix, collected)
  return collected.sort()
}

export function scanProofPaths({
  root = REPOSITORY_ROOT,
  manifest = MANIFEST,
  prefixes = PROOF_PATH_PREFIXES,
  files,
} = {}) {
  const declared = new Set(manifest.map((entry) => entry.path))
  const candidates = files ? [...files].sort() : discoverProofFiles({ root, prefixes })
  const findings = []

  for (const candidate of candidates) {
    const path = candidate.split(sep).join('/')
    const extension = extensionOf(path)

    if (!declared.has(path)) {
      if (ASSET_EXTENSIONS.has(extension)) {
        findings.push({ artifactClass: 'undeclared-asset', path, rule: 'not-in-manifest' })
        continue
      }
      if (DATA_EXTENSIONS.has(extension) && FIXTURE_SEGMENT.test(path)) {
        findings.push({ artifactClass: 'unapproved-fixture', path, rule: 'not-in-manifest' })
      }
      continue
    }

    if (!TEXT_EXTENSIONS.has(extension)) continue
    const absolute = join(root, path)
    if (!existsSync(absolute) || statSync(absolute).size > MAX_TEXT_BYTES) continue
    const content = readFileSync(absolute, 'utf8')
    for (const { rule, pattern } of CREDENTIAL_RULES) {
      if (pattern.test(content)) {
        findings.push({ artifactClass: 'credential-shaped-value', path, rule })
      }
    }
  }

  return findings
}

export function formatFindings(findings) {
  return findings.map((finding) => `${finding.artifactClass}: ${finding.path} (${finding.rule})`)
}
