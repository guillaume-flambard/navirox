#!/usr/bin/env node
/**
 * Proof-artifact hygiene check.
 *
 * Scans the proof paths (the declared artifacts plus the fixture trees) for
 * credential-shaped values, unapproved fixture data and undeclared assets. The
 * report names the artifact class and the rule, never the matched value, and a
 * non-zero exit blocks the upload that would follow it.
 */
import {
  MANIFEST,
  MANIFEST_DOCUMENT,
  PROOF_PATH_PREFIXES,
  formatFindings,
  scanProofPaths,
} from './lib/proof-artifacts.mjs'

const findings = scanProofPaths()

if (findings.length === 0) {
  console.log(
    `proof artifacts: ${MANIFEST.length} declared artifacts clean across ${PROOF_PATH_PREFIXES.length} proof paths`,
  )
  process.exit(0)
}

console.error(`proof artifacts: ${findings.length} finding(s)`)
for (const line of formatFindings(findings)) {
  console.error(`  ${line}`)
}
console.error(
  `see ${MANIFEST_DOCUMENT} for the declared artifacts, the allowlist and the review path`,
)
process.exit(1)
