import { describe, expect, it } from 'vitest'
import {
  COMPATIBILITY_STATUSES,
  CompatibilityDataError,
  CompatibilityRegistry,
  EVIDENCE_LEVELS,
  SEED_RECORDS,
  loadSeedRegistry,
  parseRegistry,
} from './index'

const valid = {
  subject: { kind: 'package', name: 'some-lib' },
  status: 'supported',
  evidence: [{ level: 'unit-tested', source: 'somewhere' }],
  notes: 'because it was tested',
}

describe('loading compatibility data', () => {
  it('refuses a record with no evidence', () => {
    expect(() => parseRegistry([{ ...valid, evidence: [] }])).toThrow(CompatibilityDataError)
    expect(() => parseRegistry([{ ...valid, evidence: [] }])).toThrow(/no evidence/)
  })

  it('refuses a status outside the set', () => {
    expect(() => parseRegistry([{ ...valid, status: 'probably' }])).toThrow(
      /outside the declared set/,
    )
  })

  it('refuses an evidence level outside the set', () => {
    expect(() =>
      parseRegistry([{ ...valid, evidence: [{ level: 'vibes', source: 'x' }] }]),
    ).toThrow(/outside the declared set/)
  })

  it('refuses a record with no note', () => {
    expect(() => parseRegistry([{ ...valid, notes: '' }])).toThrow(/no note/)
  })

  it('accepts a well formed record', () => {
    expect(parseRegistry([valid])).toHaveLength(1)
  })
})

describe('the seed', () => {
  it('validates, and every record names where it was demonstrated', () => {
    const registry = loadSeedRegistry()

    expect(registry.size).toBeGreaterThan(5)

    for (const record of registry.list()) {
      expect(record.evidence.length).toBeGreaterThan(0)
      expect(COMPATIBILITY_STATUSES).toContain(record.status)
      for (const evidence of record.evidence) {
        expect(EVIDENCE_LEVELS).toContain(evidence.level)
        expect(evidence.source.length).toBeGreaterThan(0)
      }
    }
  })

  it('holds no package this repository cannot demonstrate', () => {
    const names = SEED_RECORDS.map((record) => record.subject.name)

    // A package nothing here runs, builds or ships must be absent rather than
    // expected to work.
    expect(names).not.toContain('axios')
    expect(names).not.toContain('lodash')
  })

  it('can be listed deterministically whatever order the data is in', () => {
    const forward = new CompatibilityRegistry(parseRegistry(SEED_RECORDS))
    const backward = new CompatibilityRegistry(parseRegistry([...SEED_RECORDS].reverse()))

    expect(forward.list().map((record) => record.subject.name)).toEqual(
      backward.list().map((record) => record.subject.name),
    )
  })

  it('finds a known subject and returns nothing for an unknown one', () => {
    const registry = loadSeedRegistry()

    expect(registry.lookup({ kind: 'package', name: 'pinia' })?.status).toBe('supported')
    expect(registry.lookup({ kind: 'package', name: 'never-heard-of-it' })).toBeUndefined()
    expect(registry.has({ kind: 'capability', name: 'local-storage' })).toBe(false)
  })
})
