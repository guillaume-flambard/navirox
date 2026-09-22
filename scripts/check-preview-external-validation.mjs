#!/usr/bin/env node
/**
 * Checks the external validation record against its declared vocabulary.
 *
 * docs/evidence/preview-external-validation.md records a self-run read of the
 * Navirox report against public repositories this project does not own. This
 * command reads that record and fails when its `Status now:` value is outside
 * the declared vocabulary, when it claims more than a status allows, or when a
 * declared repository is not an external public one. A non-zero exit blocks the
 * release that would follow.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  EXTERNAL_REPOSITORIES,
  VALIDATION_DOCUMENT,
  checkExternalValidation,
  formatExternalValidation,
} from './lib/preview-external-validation.mjs'
import { REPOSITORY_ROOT } from './lib/proof-artifacts.mjs'

const document = readFileSync(join(REPOSITORY_ROOT, VALIDATION_DOCUMENT), 'utf8')

const findings = checkExternalValidation({
  document,
  repositories: EXTERNAL_REPOSITORIES,
})

console.log(formatExternalValidation(findings))

if (findings.length > 0) {
  process.exit(1)
}
