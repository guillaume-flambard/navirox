import type { AppGraph } from '@memolabs-apps/graph'
import { APP_GRAPH_SCHEMA_VERSION } from '@memolabs-apps/graph'
import { describe, expect, it } from 'vitest'
import { plan } from './index'
import {
  MissingTypesafeKeyError,
  createTypeSafeJudge,
  suggestForUndecided,
  type SemanticAnswer,
  type SemanticJudge,
} from './index'

/**
 * The semantic layer, tested without a network.
 *
 * The judge is an interface precisely so these tests never touch TypeSafe:
 * a fake answers, and the assertions cover the mapping, the batching and the
 * honesty of the layer when the answer is unusable.
 */

function graph(overrides: Partial<AppGraph> = {}): AppGraph {
  return {
    schemaVersion: APP_GRAPH_SCHEMA_VERSION,
    source: { adapterId: 'fixture', displayName: 'Fixture' },
    routes: [],
    screens: [],
    units: [],
    actions: [],
    data: [],
    capabilities: [],
    dependencies: [],
    edges: [],
    findings: [],
    ...overrides,
  }
}

const location = (file: string) => ({ file, adapterId: 'fixture' })

function undecidedGraph(): AppGraph {
  return graph({
    units: [
      {
        id: 'fixture:src/lib/money.ts:domain-module:default',
        kind: 'domain-module',
        source: location('src/lib/money.ts'),
        dependencies: [],
      },
    ],
    capabilities: [
      {
        id: 'fixture:src/a.ts:capability:bluetooth',
        capability: 'bluetooth',
        usage: 'unknown',
        source: location('src/a.ts'),
      },
    ],
    dependencies: [{ id: 'dep:left-pad', name: 'left-pad', version: '1.3.0' }],
  })
}

function fakeJudge(answers: Record<string, SemanticAnswer>): SemanticJudge & { calls: number } {
  const judge = {
    calls: 0,
    judge: () => {
      judge.calls += 1
      return Promise.resolve(answers)
    },
  }

  return judge
}

describe('suggesting for the undecided', () => {
  it('requests nothing when the plan decided everything', async () => {
    const decided = plan(
      graph({
        units: [
          {
            id: 'fixture:src/lib/money.ts:domain-module:default',
            kind: 'domain-module',
            source: location('src/lib/money.ts'),
            dependencies: [],
          },
        ],
      }),
    )
    const judge = fakeJudge({})

    expect(await suggestForUndecided(graph(), decided, judge)).toEqual([])
    expect(judge.calls).toBe(0)
  })

  it('submits only the manual and unknown subjects in one request', async () => {
    const fixture = undecidedGraph()
    const planned = plan(fixture)
    const judge = fakeJudge({
      q0: { choice: 'adaptable', confidence: 0.9, probabilities: { adaptable: 0.9 } },
      q1: { choice: 'shared', confidence: 0.4, probabilities: { shared: 0.4 } },
    })

    const suggestions = await suggestForUndecided(fixture, planned, judge)

    expect(judge.calls).toBe(1)
    expect(suggestions.map((suggestion) => suggestion.subject).sort()).toEqual(
      ['fixture:src/a.ts:capability:bluetooth', 'dep:left-pad'].sort(),
    )
    expect(suggestions[0]).toMatchObject({
      suggested: 'adaptable',
      confidence: 'high',
      modelConfidence: 0.9,
    })
    expect(suggestions[1]).toMatchObject({ suggested: 'shared', confidence: 'low' })
  })

  it('answers unknown honestly when the judge answer is unusable', async () => {
    const fixture = undecidedGraph()
    const planned = plan(fixture)
    const judge: SemanticJudge = {
      judge: () => Promise.resolve({}),
    }

    const suggestions = await suggestForUndecided(fixture, planned, judge)

    expect(suggestions).toHaveLength(2)
    for (const suggestion of suggestions) {
      expect(suggestion.suggested).toBe('unknown')
      expect(suggestion.confidence).toBe('low')
      expect(suggestion.message).toContain('unusable')
    }
  })

  it('maps the confidence floors', async () => {
    const fixture = undecidedGraph()
    const planned = plan(fixture)
    const judge = fakeJudge({
      q0: { choice: 'portable', confidence: 0.8, probabilities: {} },
      q1: { choice: 'portable', confidence: 0.5, probabilities: {} },
    })

    const suggestions = await suggestForUndecided(fixture, planned, judge)

    expect(suggestions[0]?.confidence).toBe('high')
    expect(suggestions[1]?.confidence).toBe('medium')
  })
})

describe('creating the TypeSafe judge', () => {
  it('refuses without an API key, before any network', () => {
    expect(() => createTypeSafeJudge(undefined, {})).toThrow(MissingTypesafeKeyError)
    expect(() => createTypeSafeJudge('   ', {})).toThrow(MissingTypesafeKeyError)
  })
})
