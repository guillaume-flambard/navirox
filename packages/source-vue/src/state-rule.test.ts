import { APP_GRAPH_SCHEMA_VERSION } from '@memolabs-apps/graph'
import { plan } from '@memolabs-apps/planner'
import { describe, expect, it } from 'vitest'
import {
  createVueStateBehaviorVerificationGuardRule,
  createVueStatePortabilityRule,
} from './state-rule'
import type { StatePortabilityEvidence } from './state-portability'

const location = (file: string) => ({ file, adapterId: 'vue' })

const evidence = (
  status: StatePortabilityEvidence['status'],
  blockers: readonly string[] = [],
): StatePortabilityEvidence => ({
  profile: 'pinia-setup',
  syntax: 'defineStore-setup',
  imports: [],
  effects: [],
  fixture: {
    id: 'counter-store',
    sourceHash: 'source-hash',
    status: 'pending',
    assertions: [],
  },
  status,
  blockers,
})

function graphWith(statePortability: StatePortabilityEvidence) {
  return {
    schemaVersion: APP_GRAPH_SCHEMA_VERSION,
    source: { adapterId: 'vue', displayName: 'Vue' },
    routes: [],
    screens: [],
    units: [
      {
        id: 'vue:src/stores/counter.ts:state-module:default',
        kind: 'state-module' as const,
        source: location('src/stores/counter.ts'),
        dependencies: [],
        metadata: { statePortability },
      },
    ],
    actions: [],
    data: [],
    capabilities: [],
    dependencies: [],
    edges: [],
    findings: [],
  }
}

function plannedFor(statePortability: StatePortabilityEvidence) {
  return plan(graphWith(statePortability), {
    rules: [createVueStatePortabilityRule()],
  })
}

describe('the Vue state behavior-verification guard rule', () => {
  it('guards an approved composable utility from neutral migration', () => {
    const graph = graphWith({
      ...evidence('approved'),
      profile: 'composable-pure',
      syntax: 'exported-useX-composable',
    })
    graph.units[0]!.kind = 'utility'
    const decision = plan(graph, { rules: [createVueStateBehaviorVerificationGuardRule()] })
      .decisions[0]

    expect(decision).toMatchObject({
      classification: 'unknown',
      reasons: [
        {
          ruleId: 'vue-state-behavior-verification-guard',
          message: expect.stringContaining('source-owned behavior verifier is required'),
        },
      ],
      blockers: ['behavior-verifier-required'],
    })
  })

  it('does not apply to a generic utility without state portability metadata', () => {
    const graph = graphWith(evidence('approved'))
    graph.units[0]!.kind = 'utility'
    graph.units[0]!.metadata = undefined

    expect(
      createVueStateBehaviorVerificationGuardRule().applies({
        graph,
        subject: graph.units[0]!.id,
        capabilitiesInUnit: [],
      }),
    ).toBe(false)
  })
})

describe('the Vue state portability rule', () => {
  it('does not apply to a state unit without source evidence', () => {
    const rule = createVueStatePortabilityRule()
    const graph = graphWith(evidence('approved'))
    graph.units[0]!.metadata = undefined

    expect(rule.applies({ graph, subject: graph.units[0]!.id, capabilitiesInUnit: [] })).toBe(false)
  })

  it('classifies approved pending evidence as a portable candidate with profile and behavior facts', () => {
    const decision = plannedFor(evidence('approved')).decisions[0]

    expect(decision).toMatchObject({
      classification: 'portable',
      reasons: [{ ruleId: 'vue-state-portability' }],
      evidence: expect.arrayContaining([
        { kind: 'source', value: expect.stringContaining('pinia-setup') },
        { kind: 'fixture', value: expect.stringContaining('counter-store') },
        { kind: 'fixture', value: expect.stringContaining('pending') },
      ]),
    })
  })

  it('classifies known effects as manual and preserves the refusal code', () => {
    const decision = plannedFor(
      evidence('manual', ['unsupported-state-effect counter.ts:4 effect network']),
    ).decisions[0]

    expect(decision).toMatchObject({
      classification: 'manual',
      blockers: ['unsupported-state-effect counter.ts:4 effect network'],
      evidence: expect.arrayContaining([
        { kind: 'source', value: expect.stringContaining('pinia-setup') },
        { kind: 'fixture', value: expect.stringContaining('counter-store') },
      ]),
    })
  })

  it('classifies unresolved or dynamic evidence as unknown', () => {
    const planned = plannedFor(
      evidence('unknown', ['dynamic-state-import counter.ts:3 dynamic import ./remote']),
    )
    const decision = planned.decisions[0]

    expect(decision).toMatchObject({
      classification: 'unknown',
      blockers: ['dynamic-state-import counter.ts:3 dynamic import ./remote'],
    })
    expect(planned.unknowns).toContain('vue:src/stores/counter.ts:state-module:default')
  })

  it('returns the same decision for identical graph input', () => {
    const statePortability = evidence('approved')
    const first = plannedFor(statePortability).decisions[0]
    const second = plannedFor(statePortability).decisions[0]

    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })
})
