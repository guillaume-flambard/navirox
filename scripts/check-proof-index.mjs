#!/usr/bin/env node
/**
 * Checks the proof index against the evidence it cites.
 *
 * The index in docs/PROOF-INDEX.md is the release-facing view of the proof
 * program: it names each journey's command, immutable input, artifact,
 * limitation and release status, and it cites the evidence rather than copying
 * it. This command reads the document and the declared rows in
 * scripts/lib/proof-index.mjs and fails when a row cites an artifact that does
 * not exist, when a benchmark project in benchmarks/catalog.json has no row, or
 * when a status word is outside the declared vocabulary. A finding names the
 * artifact class and the rule, never a value, and a non-zero exit blocks the
 * release that would follow.
 */
import {
  BENCHMARKS,
  INDEX_DOCUMENT,
  JOURNEYS,
  checkProofIndex,
  formatFindings,
} from './lib/proof-index.mjs'
import { REPOSITORY_ROOT } from './lib/proof-artifacts.mjs'

const findings = checkProofIndex({ root: REPOSITORY_ROOT })

if (findings.length === 0) {
  console.log(
    `proof index: ${JOURNEYS.length} journeys and ${BENCHMARKS.length} benchmarks clean in ${INDEX_DOCUMENT}`,
  )
  process.exit(0)
}

console.error(`proof index: ${findings.length} finding(s)`)
for (const line of formatFindings(findings)) {
  console.error(`  ${line}`)
}
console.error(`The index is described in ${INDEX_DOCUMENT}.`)
process.exit(1)
