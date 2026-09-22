#!/usr/bin/env node
/**
 * Requalify the benchmark catalog without rewriting history.
 *
 * This command reads benchmarks/catalog.json, asks each pinned repository for
 * its current default-branch head, and writes the comparison to
 * docs/evidence/requalification.json. It never edits a historical report or a
 * catalog entry, and it exits 0 even when it finds drift: a drift finding is a
 * question for a person (retain the pin, create a new pinned profile, or retire
 * the claim), not a build failure. Read docs/PROOF-ARTIFACTS.md for that path.
 *
 * Usage: node scripts/requalify-benchmarks.mjs [--root <dir>]
 */
import {
  REPORT_PATH,
  formatRequalification,
  writeRequalificationReport,
} from './lib/requalification.mjs'
import { REPOSITORY_ROOT } from './lib/proof-artifacts.mjs'

const readRoot = (argv) => {
  const flag = argv.indexOf('--root')
  return flag === -1 ? REPOSITORY_ROOT : argv[flag + 1]
}

const root = readRoot(process.argv.slice(2))
const { report } = writeRequalificationReport({ root })
const drifted = report.projects.filter((project) => project.status !== 'pinned')

console.log(
  `requalification: ${report.projects.length} benchmark projects, ${drifted.length} not pinned`,
)
for (const line of formatRequalification(report)) {
  console.log(line)
}
console.log(`report: ${REPORT_PATH}`)

if (drifted.length > 0) {
  console.log('drift is a decision, not an error: retain, re-pin, or retire the claim')
}
