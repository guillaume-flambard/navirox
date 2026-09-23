import { describe, expect, it } from 'vitest'
import {
  REQUALIFICATION_GATES,
  RequalificationDataError,
  loadSeedVersionMatrix,
  openRequalification,
} from './index'

describe('opening a requalification', () => {
  it('opens one for an unverified upstream major without widening the range', () => {
    const matrix = loadSeedVersionMatrix()
    const before = matrix.verifiedRangesFor('vue', 'vue')
    const requalification = openRequalification(matrix, {
      adapterId: 'vue',
      framework: 'vue',
      candidateMajor: 4,
      fixture: 'packages/source-vue/fixtures/version-requalification-vue4',
    })

    expect(requalification.adapterId).toBe('vue')
    expect(requalification.framework).toBe('vue')
    expect(requalification.candidateMajor).toBe(4)
    expect(requalification.status).toBe('open')
    expect(requalification.gates).toEqual(REQUALIFICATION_GATES)
    expect(requalification.passed).toEqual([])
    expect(matrix.verifiedRangesFor('vue', 'vue')).toEqual(before)
  })

  it('refuses a candidate major the matrix already verifies', () => {
    const matrix = loadSeedVersionMatrix()

    expect(() =>
      openRequalification(matrix, {
        adapterId: 'vue',
        framework: 'vue',
        candidateMajor: 3,
        fixture: 'packages/source-vue/fixtures/version-positive',
      }),
    ).toThrow(RequalificationDataError)
  })

  it('refuses an unknown adapter or framework', () => {
    const matrix = loadSeedVersionMatrix()

    expect(() =>
      openRequalification(matrix, {
        adapterId: 'never-heard-of-it',
        framework: 'vue',
        candidateMajor: 4,
        fixture: 'x',
      }),
    ).toThrow(/matrix row governs/)

    expect(() =>
      openRequalification(matrix, {
        adapterId: 'vue',
        framework: 'never-heard-of-it',
        candidateMajor: 4,
        fixture: 'x',
      }),
    ).toThrow(/matrix row governs/)
  })

  it('refuses a requalification with no fixture', () => {
    const matrix = loadSeedVersionMatrix()

    expect(() =>
      openRequalification(matrix, {
        adapterId: 'vue',
        framework: 'vue',
        candidateMajor: 4,
        fixture: '',
      }),
    ).toThrow(/no fixture/)
  })
})

describe('closing a requalification', () => {
  it('keeps the range unchanged until every gate passes', () => {
    const matrix = loadSeedVersionMatrix()
    const opened = openRequalification(matrix, {
      adapterId: 'vue',
      framework: 'vue',
      candidateMajor: 4,
      fixture: 'packages/source-vue/fixtures/version-requalification-vue4',
    })
    const partial = {
      ...opened,
      passed: ['corpus', 'builds'] as const,
    }

    expect(partial.status).toBe('open')
    expect(matrix.verifiedRangesFor('vue', 'vue')).toEqual(['^3.5.0'])
  })

  it('names the gates a major must pass', () => {
    expect(REQUALIFICATION_GATES).toEqual([
      'corpus',
      'builds',
      'device-journeys',
      'captures',
      'matrix-update',
    ])
  })
})
