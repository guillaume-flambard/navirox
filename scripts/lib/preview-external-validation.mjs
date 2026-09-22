/**
 * The external repositories the preview validation reads, and the statuses a
 * validation record may carry.
 *
 * docs/evidence/preview-external-validation.md records a self-run read of the
 * Navirox report against public repositories this project does not own. This
 * module is the machine-readable twin of that record: it declares the
 * repositories (public, pinned to a commit, outside the workspace) and the
 * closed set of validation statuses the project already uses, and the check in
 * scripts/check-preview-external-validation.mjs fails when the record names a
 * status outside that set or claims more than the strongest one allows.
 *
 * Findings carry the offending status value, because that is what a reader
 * needs to fix. They never carry a repository body or a report value.
 */

export const VALIDATION_DOCUMENT = 'docs/evidence/preview-external-validation.md'

/**
 * The statuses a validation record may carry, from docs/WORKFLOW-EVIDENCE.md.
 * `unvalidated hypothesis` is what a self-run read is; `practitioner-informed`
 * is the strongest a consented conversation can reach. Both remain short of
 * customer demand.
 */
export const VALIDATION_STATUSES = ['unvalidated hypothesis', 'practitioner-informed']

/** The strongest status a record may carry, whatever else it contains. */
export const STRONGEST_STATUS = 'practitioner-informed'

export const EXTERNAL_REPOSITORIES = [
  {
    id: 'nuxt-movies',
    repository: 'https://github.com/nuxt/movies.git',
    commit: 'ce256d64f4c9ddf93da44fa88d7662678853aed3',
    applicationRoot: true,
  },
  {
    id: 'nuxt-ui',
    repository: 'https://github.com/nuxt/ui.git',
    commit: 'bab8c5af30dd4e6cb14d42144e82b9c8863d2cc6',
    applicationRoot: false,
  },
]

export const FINDING_CLASSES = {
  unknownStatus: 'unknown-status',
  overstatedClaim: 'overstated-claim',
  fixtureRepository: 'workspace-repository',
}

/** Phrases a record must not use, because they claim more than a status allows. */
const OVERSTATING_PHRASES = [
  'customer demand',
  'production-ready',
  'production ready',
  'supported framework',
  'partnership',
]

/**
 * Finds the `Status now:` value in a validation record. Returns the value or an
 * empty string.
 */
export function readStatus(document) {
  const match = document.match(/^Status now:\s*(.+)$/m)
  return match ? match[1].trim() : ''
}

/**
 * Checks a validation record against the declared vocabulary and the declared
 * repository list. Pure given the document, so a seeded document proves the
 * failure path.
 */
export function checkExternalValidation({ document, repositories = EXTERNAL_REPOSITORIES } = {}) {
  const findings = []
  const status = readStatus(document)

  if (status === '' || !VALIDATION_STATUSES.includes(status)) {
    findings.push({ class: FINDING_CLASSES.unknownStatus, value: status })
  }

  const lower = document.toLowerCase()
  for (const phrase of OVERSTATING_PHRASES) {
    if (lower.includes(phrase)) {
      findings.push({ class: FINDING_CLASSES.overstatedClaim, value: phrase })
    }
  }

  for (const entry of repositories) {
    if (!entry.repository.startsWith('https://github.com/')) {
      findings.push({ class: FINDING_CLASSES.fixtureRepository, value: entry.id })
    }
  }

  return findings
}

export function formatFindings(findings) {
  return findings.map((finding) => `${finding.class}: ${finding.value}`)
}

export function formatExternalValidation(findings) {
  if (findings.length === 0) {
    return `preview external validation: status and ${EXTERNAL_REPOSITORIES.length} declared repositories clean`
  }
  return [
    `preview external validation: ${findings.length} finding(s)`,
    ...formatFindings(findings).map((line) => `  ${line}`),
    `The record is described in ${VALIDATION_DOCUMENT}.`,
  ].join('\n')
}
