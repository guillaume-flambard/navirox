import { describe, expect, it } from 'vitest'
import {
  EXTERNAL_REPOSITORIES,
  FINDING_CLASSES,
  VALIDATION_STATUSES,
  checkExternalValidation,
  formatExternalValidation,
  readStatus,
} from '../../../scripts/lib/preview-external-validation.mjs'

const CLEAN = `# External validation

Status now: unvalidated hypothesis

Basis: a self-run analysis of public repositories.
`

describe('preview external validation', () => {
  it('accepts a record whose status is in the declared vocabulary', () => {
    const findings = checkExternalValidation({ document: CLEAN })
    expect(findings).toEqual([])
    expect(formatExternalValidation(findings)).toContain('clean')
  })

  it('fails and names the value when the status is unknown', () => {
    const document = CLEAN.replace('unvalidated hypothesis', 'externally-validated')
    const findings = checkExternalValidation({ document })
    expect(findings).toEqual([
      { class: FINDING_CLASSES.unknownStatus, value: 'externally-validated' },
    ])
    expect(formatExternalValidation(findings)).toContain('externally-validated')
  })

  it('fails when a record claims a customer demand', () => {
    const document = `${CLEAN}\nThis proves customer demand.\n`
    const findings = checkExternalValidation({ document })
    expect(findings.map((finding) => finding.class)).toContain(FINDING_CLASSES.overstatedClaim)
  })

  it('reads the declared status line only', () => {
    expect(readStatus(CLEAN)).toBe(VALIDATION_STATUSES[0])
    expect(readStatus(`${CLEAN}\nStatus now: practitioner-informed\n`)).toBe(
      'unvalidated hypothesis',
    )
  })

  it('flags a declared repository that is not an external public one', () => {
    const findings = checkExternalValidation({
      document: CLEAN,
      repositories: [{ id: 'local', repository: 'file:///tmp/fixture' }],
    })
    expect(findings).toEqual([{ class: FINDING_CLASSES.fixtureRepository, value: 'local' }])
  })

  it('declares only external public repositories', () => {
    expect(
      EXTERNAL_REPOSITORIES.every((entry) => entry.repository.startsWith('https://github.com/')),
    ).toBe(true)
    expect(EXTERNAL_REPOSITORIES.every((entry) => entry.commit.length === 40)).toBe(true)
  })
})
