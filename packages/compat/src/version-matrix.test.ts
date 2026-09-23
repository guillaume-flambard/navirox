import { describe, expect, it } from 'vitest'
import {
  OUTSIDE_VERIFIED_RANGE,
  VERSION_MATRIX_GATES,
  VERSION_MATRIX_SCHEMA_VERSION,
  VersionMatrix,
  VersionMatrixDataError,
  loadSeedVersionMatrix,
  parseVersionMatrix,
} from './index'

const valid = {
  adapterId: 'vue',
  profile: 'vue-single-file-component',
  framework: 'vue',
  verifiedVersions: ['^3.5.0'],
  topologyProfiles: ['single-package'],
  admittedPlugins: ['vue-router'],
  admittedConfigs: ['tsconfig.json'],
  coveredConstructs: ['single-file-component'],
  escapeHatches: ['manual-required'],
  targetProfiles: [],
  evidence: [{ level: 'fixture-tested', source: 'packages/source-vue/fixtures/vue-app' }],
  gate: 'T0',
}

describe('parsing the version matrix', () => {
  it('refuses a row that names no evidence', () => {
    expect(() => parseVersionMatrix([{ ...valid, evidence: [] }])).toThrow(VersionMatrixDataError)
    expect(() => parseVersionMatrix([{ ...valid, evidence: [] }])).toThrow(/no evidence/)
  })

  it('refuses a row with an evidence level outside the declared set', () => {
    expect(() =>
      parseVersionMatrix([{ ...valid, evidence: [{ level: 'vibes', source: 'x' }] }]),
    ).toThrow(/outside the declared set/)
  })

  it('refuses a row with an evidence entry that names no source', () => {
    expect(() =>
      parseVersionMatrix([{ ...valid, evidence: [{ level: 'fixture-tested', source: '' }] }]),
    ).toThrow(/names no source/)
  })

  it('refuses a row with a gate outside the declared set', () => {
    expect(() => parseVersionMatrix([{ ...valid, gate: 'T9' }])).toThrow(/outside the declared set/)
  })

  it('refuses a row that names no verified version', () => {
    expect(() => parseVersionMatrix([{ ...valid, verifiedVersions: [] }])).toThrow(
      /no verified version/,
    )
    expect(() => parseVersionMatrix([{ ...valid, verifiedVersions: [''] }])).toThrow(
      /no verified version/,
    )
  })

  it('refuses a row that omits a required dimension', () => {
    const withoutConstructs: Record<string, unknown> = { ...valid }

    delete withoutConstructs['coveredConstructs']

    expect(() => parseVersionMatrix([withoutConstructs])).toThrow(/coveredConstructs/)
  })

  it('refuses a row that names no adapter, profile or framework', () => {
    expect(() => parseVersionMatrix([{ ...valid, adapterId: '' }])).toThrow(/no adapter/)
    expect(() => parseVersionMatrix([{ ...valid, profile: '' }])).toThrow(/no profile/)
    expect(() => parseVersionMatrix([{ ...valid, framework: '' }])).toThrow(/no framework/)
  })

  it('accepts a well formed row with no verified target profile yet', () => {
    expect(parseVersionMatrix([valid])).toHaveLength(1)
  })
})

describe('the seed matrix', () => {
  it('is versioned and lists one profile per adapter in a stable order', () => {
    expect(VERSION_MATRIX_SCHEMA_VERSION).toBe(1)
    expect(VERSION_MATRIX_GATES).toContain('T0')

    const matrix = loadSeedVersionMatrix()
    const keys = matrix.list().map((row) => `${row.adapterId}:${row.profile}`)

    expect(keys).toEqual([...keys].sort())
    expect(matrix.rowsFor('vue')).toHaveLength(1)
  })

  it('covers exactly the Vue, Angular, React and Svelte lines, each with evidence and a gate', () => {
    const matrix = loadSeedVersionMatrix()

    for (const adapterId of ['vue', 'angular', 'react', 'svelte']) {
      const rows = matrix.rowsFor(adapterId)

      expect(rows.length).toBeGreaterThan(0)

      for (const row of rows) {
        expect(row.verifiedVersions.length).toBeGreaterThan(0)
        expect(row.evidence.length).toBeGreaterThan(0)
        expect(VERSION_MATRIX_GATES).toContain(row.gate)
      }
    }
  })

  it('mirrors the ranges the adapters declare, so one place can be audited', () => {
    const matrix = loadSeedVersionMatrix()

    expect(matrix.verifiedRangesFor('vue', 'vue')).toEqual(['^3.5.0'])
    expect(matrix.verifiedRangesFor('angular', '@angular/core')).toEqual(['^20.0.0', '^21.0.0'])
    expect(matrix.verifiedRangesFor('react', 'react')).toEqual(['^19.0.0'])
    expect(matrix.verifiedRangesFor('svelte', 'svelte')).toEqual(['^5.0.0'])
  })

  it('returns nothing for an unknown adapter, which is not an error', () => {
    const matrix = loadSeedVersionMatrix()

    expect(matrix.rowsFor('never-heard-of-it')).toEqual([])
    expect(matrix.verifiedRangesFor('never-heard-of-it', 'vue')).toEqual([])
  })

  it('names the deterministic refusal code', () => {
    expect(OUTSIDE_VERIFIED_RANGE).toBe('outside-verified-range')
    expect(new VersionMatrix(parseVersionMatrix([valid])).list()).toHaveLength(1)
  })
})
