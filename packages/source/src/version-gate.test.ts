import { describe, expect, it } from 'vitest'
import { checkVerifiedRange, resolveAdapterVersions } from './index'

const VUE_RANGES = ['^3.5.0']

describe('checking a declared version against verified ranges', () => {
  it('accepts a version at the edge of the verified range', () => {
    expect(
      checkVerifiedRange({
        adapterId: 'vue',
        profile: 'vue-single-file-component',
        framework: 'vue',
        verifiedVersions: VUE_RANGES,
        declaredRange: '3.5.0',
        location: 'package.json',
      }),
    ).toEqual({ ok: true })
  })

  it('accepts a version inside the verified range', () => {
    expect(
      checkVerifiedRange({
        adapterId: 'vue',
        profile: 'vue-single-file-component',
        framework: 'vue',
        verifiedVersions: VUE_RANGES,
        declaredRange: '^3.5.0',
        location: 'package.json',
      }),
    ).toEqual({ ok: true })
  })

  it('refuses a version past the verified range with the fact, location, profile and resumption', () => {
    const outcome = checkVerifiedRange({
      adapterId: 'vue',
      profile: 'vue-single-file-component',
      framework: 'vue',
      verifiedVersions: VUE_RANGES,
      declaredRange: '^4.0.0',
      location: 'package.json',
    })

    expect(outcome.ok).toBe(false)

    if (outcome.ok) return

    expect(outcome.refusal.code).toBe('outside-verified-range')
    expect(outcome.refusal.fact).toContain('vue')
    expect(outcome.refusal.fact).toContain('^4.0.0')
    expect(outcome.refusal.location).toBe('package.json')
    expect(outcome.refusal.expectedProfile).toBe('vue-single-file-component')
    expect(outcome.refusal.verifiedVersions).toEqual(VUE_RANGES)
    expect(outcome.refusal.resumption.length).toBeGreaterThan(0)
  })

  it('is deterministic: the same inputs refuse the same way twice', () => {
    const input = {
      adapterId: 'vue',
      profile: 'vue-single-file-component',
      framework: 'vue',
      verifiedVersions: VUE_RANGES,
      declaredRange: '^4.0.0',
      location: 'package.json',
    }

    expect(checkVerifiedRange(input)).toEqual(checkVerifiedRange(input))
  })

  it('does not refuse when no major can be established', () => {
    expect(
      checkVerifiedRange({
        adapterId: 'vue',
        profile: 'vue-single-file-component',
        framework: 'vue',
        verifiedVersions: VUE_RANGES,
        declaredRange: undefined,
        location: 'package.json',
      }),
    ).toEqual({ ok: true })
  })

  it('accepts every verified major of a multi-range line', () => {
    for (const declared of ['^20.0.0', '^21.2.1']) {
      expect(
        checkVerifiedRange({
          adapterId: 'angular',
          profile: 'angular-standalone-component',
          framework: '@angular/core',
          verifiedVersions: ['^20.0.0', '^21.0.0'],
          declaredRange: declared,
          location: 'package.json',
        }),
      ).toEqual({ ok: true })
    }

    const refused = checkVerifiedRange({
      adapterId: 'angular',
      profile: 'angular-standalone-component',
      framework: '@angular/core',
      verifiedVersions: ['^20.0.0', '^21.0.0'],
      declaredRange: '^19.0.0',
      location: 'package.json',
    })

    expect(refused.ok).toBe(false)
  })
})

describe('resolving the ranges an adapter may read', () => {
  it('prefers the matrix row over a hard-coded fallback', () => {
    expect(
      resolveAdapterVersions({ matrixRanges: ['^3.5.0'], fallbackRanges: ['^2.0.0'] }),
    ).toEqual(['^3.5.0'])
  })

  it('falls back only when the matrix names no range', () => {
    expect(resolveAdapterVersions({ matrixRanges: [], fallbackRanges: ['^3.5.0'] })).toEqual([
      '^3.5.0',
    ])
  })
})
