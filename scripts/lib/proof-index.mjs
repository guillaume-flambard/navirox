/**
 * The proof index is the release-facing view of the proof program: one document
 * that cites the evidence rather than copying it, so an outside evaluator can
 * tell what is proven from what is installed. This module is the
 * machine-readable twin of the tables in docs/PROOF-INDEX.md, and the check in
 * packages/visual-benchmark/src/proof-index.test.ts fails when the two drift
 * apart.
 *
 * A finding names the artifact class and the rule. It never carries a value.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { REPOSITORY_ROOT } from './proof-artifacts.mjs'
import { readCatalog } from './requalification.mjs'

export const INDEX_DOCUMENT = 'docs/PROOF-INDEX.md'
export const CATALOG_PATH = 'benchmarks/catalog.json'

export const RELEASE_STATUS = ['supported', 'simulated', 'deferred', 'excluded']

export const FINDING_CLASSES = {
  missingArtifact: 'missing-artifact',
  journeyWithoutRow: 'journey-without-row',
  benchmarkWithoutRow: 'benchmark-without-row',
  unknownStatus: 'unknown-status',
  documentDrift: 'document-drift',
}

export const JOURNEYS = [
  {
    id: 'vue-field-record-update',
    name: 'Vue: field record update',
    command: 'node packages/visual-benchmark/scripts/capture-records-native.mjs --platform ios',
    input: 'baserow/baserow@81e094a1f4b3a62625c218d78fe319ba44098617 (web-frontend, nuxt adapter)',
    artifacts: [
      'docs/evidence/native-capture-field-workflow-ios.json',
      'docs/evidence/vue-companion-device-evidence.md',
    ],
    status: 'simulated',
  },
  {
    id: 'angular-record-update-with-attachment',
    name: 'Angular: record update with attachment',
    command: 'node scripts/capture-angular-companion.mjs --platform ios',
    input: 'salesagility/SuiteCRM-Core@2cd77380bc838b8bd6c80f9fbe25855d73ef860c',
    artifacts: [
      'docs/evidence/angular-companion-device-evidence-ios.json',
      'docs/evidence/angular-companion-device-evidence.md',
    ],
    status: 'simulated',
  },
]

export const BENCHMARKS = [
  {
    id: 'baserow',
    repository: 'https://github.com/baserow/baserow.git',
    commit: '81e094a1f4b3a62625c218d78fe319ba44098617',
    adapter: 'nuxt',
    artifacts: [
      'docs/evidence/workflow-baserow-field-work.md',
      'docs/evidence/vue-target-baserow-diagnostic.json',
    ],
    status: 'supported',
  },
  {
    id: 'cal-com',
    repository: 'https://github.com/calcom/cal.com.git',
    commit: '54343aa685ae8f33159d2f485ec4a57bad5c574a',
    adapter: 'next',
    artifacts: ['benchmarks/catalog.json', 'docs/benchmarks.md'],
    status: 'deferred',
  },
  {
    id: 'suitecrm',
    repository: 'https://github.com/salesagility/SuiteCRM-Core.git',
    commit: '2cd77380bc838b8bd6c80f9fbe25855d73ef860c',
    adapter: 'angular',
    artifacts: [
      'docs/evidence/workflow-suitecrm-record-workflow.md',
      'docs/evidence/angular-suitecrm-benchmark.md',
    ],
    status: 'supported',
  },
]

function entryFindings(entry, document, root) {
  const findings = []

  if (!RELEASE_STATUS.includes(entry.status)) {
    findings.push({
      artifactClass: FINDING_CLASSES.unknownStatus,
      path: entry.id,
      rule: entry.status,
    })
  }

  for (const artifact of entry.artifacts) {
    if (!existsSync(join(root, artifact))) {
      findings.push({
        artifactClass: FINDING_CLASSES.missingArtifact,
        path: artifact,
        rule: entry.id,
      })
    }
    if (!document.includes(artifact)) {
      findings.push({
        artifactClass: FINDING_CLASSES.documentDrift,
        path: artifact,
        rule: entry.id,
      })
    }
  }

  return findings
}

/**
 * Compares the declared rows, the catalog and the document. Every finding names
 * the artifact class and the rule; none of them carries a value.
 */
export function checkProofIndex({
  root = REPOSITORY_ROOT,
  journeys = JOURNEYS,
  benchmarks = BENCHMARKS,
  catalog,
} = {}) {
  const document = readFileSync(join(root, INDEX_DOCUMENT), 'utf8')
  const resolvedCatalog = catalog ?? readCatalog(root)
  const findings = []

  for (const entry of [...journeys, ...benchmarks]) {
    findings.push(...entryFindings(entry, document, root))
  }

  for (const journey of journeys) {
    if (!document.includes(journey.name)) {
      findings.push({
        artifactClass: FINDING_CLASSES.journeyWithoutRow,
        path: journey.id,
        rule: 'not-in-document',
      })
    }
  }

  for (const project of resolvedCatalog.projects ?? []) {
    if (!benchmarks.some((benchmark) => benchmark.id === project.id)) {
      findings.push({
        artifactClass: FINDING_CLASSES.benchmarkWithoutRow,
        path: project.id,
        rule: 'not-in-index',
      })
    }
  }

  return findings.sort((left, right) =>
    `${left.artifactClass}${left.path}`.localeCompare(`${right.artifactClass}${right.path}`),
  )
}

export function formatFindings(findings) {
  return findings.map((finding) => `${finding.artifactClass}: ${finding.path} (${finding.rule})`)
}
