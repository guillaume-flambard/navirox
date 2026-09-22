import { describe, expect, it } from 'vitest'
import {
  DOCUMENTED_PACKAGES,
  FINDING_CLASSES,
  STATED_UNPUBLISHED,
  checkPublicDistribution,
  formatPublicDistribution,
} from '../../../scripts/lib/public-distribution.mjs'

const makeResolver = (served: Record<string, string>) => async (name: string) =>
  Object.hasOwn(served, name) ? served[name] : null

describe('public distribution', () => {
  it('passes when the registry matches the stated limitation', async () => {
    const served: Record<string, string> = {}
    for (const name of DOCUMENTED_PACKAGES) {
      if (!STATED_UNPUBLISHED.includes(name)) {
        served[name] = '0.1.0'
      }
    }
    const findings = await checkPublicDistribution({
      packages: DOCUMENTED_PACKAGES,
      stated: STATED_UNPUBLISHED,
      resolve: makeResolver(served),
    })
    expect(findings).toEqual([])
    expect(formatPublicDistribution(findings)).toContain('match the stated limitation')
  })

  it('fails and names the package when a needed package the docs do not state is not served', async () => {
    const served: Record<string, string> = {}
    for (const name of STATED_UNPUBLISHED) {
      served[name] = '0.1.0'
    }
    const findings = await checkPublicDistribution({
      packages: ['@memolabs-apps/target-vue'],
      stated: [],
      resolve: makeResolver({}),
    })
    expect(findings).toEqual([
      { class: FINDING_CLASSES.neededButNotServed, name: '@memolabs-apps/target-vue' },
    ])
    expect(formatPublicDistribution(findings)).toContain('@memolabs-apps/target-vue')
  })

  it('fails when a package stated as unpublished is in fact served', async () => {
    const served: Record<string, string> = {}
    for (const name of DOCUMENTED_PACKAGES) {
      served[name] = '0.1.0'
    }
    const findings = await checkPublicDistribution({
      packages: DOCUMENTED_PACKAGES,
      stated: STATED_UNPUBLISHED,
      resolve: makeResolver(served),
    })
    expect(findings.map((finding) => finding.name)).toEqual([...STATED_UNPUBLISHED])
    expect(findings.every((finding) => finding.class === FINDING_CLASSES.statedButServed)).toBe(
      true,
    )
  })
})
