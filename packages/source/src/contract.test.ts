import { emptyGraphFragment } from '@memolabs-apps/graph'
import { describe, expect, it } from 'vitest'

import { verifyAdapterContract } from './index'
import type { DetectionContext, SourceAdapter } from './index'

const CONTEXT: DetectionContext = {
  rootDir: '.',
  files: ['package.json'],
  readText: () => undefined,
}

function adapterOf(overrides: Partial<SourceAdapter>): SourceAdapter {
  return {
    id: 'fictive',
    displayName: 'Fictive',
    supportLevel: 'experimental',
    testedVersions: [{ framework: 'fictive', versions: ['1.0.0'] }],
    detect: async () => ({
      candidates: [{ confidence: 'high', evidence: [{ kind: 'manifest', value: 'package.json' }] }],
    }),
    inspect: async () => ({
      descriptor: { adapterId: 'fictive', displayName: 'Fictive' },
      findings: [],
    }),
    buildGraph: async () => emptyGraphFragment(),
    ...overrides,
  }
}

describe('verifyAdapterContract', () => {
  it('finds nothing wrong with an adapter that keeps the rules', async () => {
    expect(await verifyAdapterContract(adapterOf({}), CONTEXT)).toEqual([])
  })

  it('flags an id that is not a machine name', async () => {
    const violations = await verifyAdapterContract(adapterOf({ id: 'Fictive Source' }), CONTEXT)

    expect(violations.map((violation) => violation.code)).toContain('id-shape')
  })

  it('flags an empty display name', async () => {
    const violations = await verifyAdapterContract(adapterOf({ displayName: '  ' }), CONTEXT)

    expect(violations.map((violation) => violation.code)).toContain('display-name')
  })

  it('flags a support level outside the closed set', async () => {
    const broken = adapterOf({ supportLevel: 'beta' as SourceAdapter['supportLevel'] })

    expect(
      (await verifyAdapterContract(broken, CONTEXT)).map((violation) => violation.code),
    ).toContain('support-level')
  })

  it('flags an adapter that declares no tested versions', async () => {
    const violations = await verifyAdapterContract(adapterOf({ testedVersions: [] }), CONTEXT)

    expect(violations.map((violation) => violation.code)).toContain('tested-versions')
  })

  it('flags detection that throws instead of reporting nothing', async () => {
    const broken = adapterOf({
      detect: async () => {
        throw new Error('unsupported syntax')
      },
    })

    expect(
      (await verifyAdapterContract(broken, CONTEXT)).map((violation) => violation.code),
    ).toContain('detect-threw')
  })

  it('flags a candidate with no evidence', async () => {
    const broken = adapterOf({
      detect: async () => ({ candidates: [{ confidence: 'high', evidence: [] }] }),
    })

    expect(
      (await verifyAdapterContract(broken, CONTEXT)).map((violation) => violation.code),
    ).toContain('candidate-evidence')
  })

  it('flags a candidate with an unknown confidence', async () => {
    const broken = adapterOf({
      detect: async () => ({
        candidates: [
          { confidence: 'certain' as 'high', evidence: [{ kind: 'source', value: 'x' }] },
        ],
      }),
    })

    expect(
      (await verifyAdapterContract(broken, CONTEXT)).map((violation) => violation.code),
    ).toContain('candidate-confidence')
  })

  it('flags detection that answers differently on the same project', async () => {
    let call = 0
    const broken = adapterOf({
      detect: async () => {
        call += 1
        return {
          candidates: [
            {
              confidence: 'high',
              evidence: [{ kind: 'manifest', value: `package.json#${call}` }],
            },
          ],
        }
      },
    })

    expect(
      (await verifyAdapterContract(broken, CONTEXT)).map((violation) => violation.code),
    ).toContain('detect-unstable')
  })
})
