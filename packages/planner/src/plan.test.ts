import type { AppGraph } from '@memolabs-apps/graph'
import { APP_GRAPH_SCHEMA_VERSION } from '@memolabs-apps/graph'
import { CompatibilityRegistry } from '@memolabs-apps/compat'
import { describe, expect, it } from 'vitest'
import { MIGRATION_CLASSES, plan } from './index'

/**
 * Rules are tested over graphs built by hand.
 *
 * A rule is a function of the graph, so a test that needs a framework to run
 * would be testing the wrong layer. Every fixture here is assembled in the test
 * and never touches a filesystem.
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

function decisionFor(planned: ReturnType<typeof plan>, subject: string) {
  return planned.decisions.find((decision) => decision.subject === subject)
}

describe('classifying a graph', () => {
  it('counts every class, including the ones that did not occur', () => {
    const planned = plan(graph())

    expect(Object.keys(planned.summary).sort()).toEqual([...MIGRATION_CLASSES].sort())
    expect(planned.summary.shared).toBe(0)
    expect(planned.summary['web-fallback']).toBe(0)
    expect(planned.schemaVersion).toBe(1)
  })

  it('classifies logic with no capability use as shared', () => {
    const planned = plan(
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

    expect(decisionFor(planned, 'fixture:src/lib/money.ts:domain-module:default')).toMatchObject({
      classification: 'shared',
      confidence: 'high',
      reasons: [{ ruleId: 'unit-shared-logic' }],
    })
  })

  it('classifies a store as portable and a component as a native replacement', () => {
    const planned = plan(
      graph({
        units: [
          {
            id: 'fixture:src/stores/a.ts:state-module:default',
            kind: 'state-module',
            source: location('src/stores/a.ts'),
            dependencies: [],
          },
          {
            id: 'fixture:src/App.vue:component:default',
            kind: 'component',
            source: location('src/App.vue'),
            dependencies: [],
          },
        ],
      }),
    )

    expect(
      decisionFor(planned, 'fixture:src/stores/a.ts:state-module:default')?.classification,
    ).toBe('portable')
    expect(decisionFor(planned, 'fixture:src/App.vue:component:default')?.classification).toBe(
      'native-replacement',
    )
  })

  it('classifies a storage use as adaptable and a canvas as a native replacement', () => {
    const planned = plan(
      graph({
        capabilities: [
          {
            id: 'fixture:src/App.vue:capability:local-storage:write',
            capability: 'local-storage',
            usage: 'write',
            source: location('src/App.vue'),
          },
          {
            id: 'fixture:src/Chart.vue:capability:canvas:render',
            capability: 'canvas',
            usage: 'render',
            source: location('src/Chart.vue'),
          },
        ],
      }),
    )

    expect(
      decisionFor(planned, 'fixture:src/App.vue:capability:local-storage:write')?.classification,
    ).toBe('adaptable')
    expect(
      decisionFor(planned, 'fixture:src/Chart.vue:capability:canvas:render')?.classification,
    ).toBe('native-replacement')
  })

  it('classifies a known capability by its counterpart, whatever direction was read', () => {
    const planned = plan(
      graph({
        capabilities: [
          {
            id: 'fixture:src/lib/storage.ts:capability:local-storage:unknown',
            capability: 'local-storage',
            usage: 'unknown',
            source: location('src/lib/storage.ts'),
          },
        ],
      }),
    )

    // The direction matters to a transform, not to the class: a native storage
    // counterpart exists whether the read knew which way the data went.
    expect(
      decisionFor(planned, 'fixture:src/lib/storage.ts:capability:local-storage:unknown'),
    ).toMatchObject({ classification: 'adaptable', reasons: [{ ruleId: 'capability-adaptable' }] })
  })

  it('sends a capability with no known counterpart to manual rather than guessing', () => {
    const planned = plan(
      graph({
        capabilities: [
          {
            id: 'fixture:src/App.vue:capability:dom:unknown',
            capability: 'dom',
            usage: 'unknown',
            source: location('src/App.vue'),
          },
        ],
      }),
    )

    expect(decisionFor(planned, 'fixture:src/App.vue:capability:dom:unknown')).toMatchObject({
      classification: 'manual',
      reasons: [{ ruleId: 'capability-no-counterpart' }],
    })
  })

  it('says a dependency has no verdict rather than staying silent', () => {
    const subject = 'fixture:package.json:dependency:some-lib'
    const planned = plan(
      graph({
        dependencies: [{ id: subject, name: 'some-lib', version: '^1.0.0' }],
      }),
    )

    expect(decisionFor(planned, subject)).toMatchObject({
      classification: 'unknown',
      reasons: [{ ruleId: 'dependency-compatibility-unknown' }],
    })
    expect(planned.unknowns).toContain(subject)
  })

  it('gives an uncovered node an explicit unknown instead of leaving it out', () => {
    const subject = 'fixture:src/odd.ts:unknown:default'
    const planned = plan(
      graph({
        units: [{ id: subject, kind: 'unknown', source: location('src/odd.ts'), dependencies: [] }],
      }),
    )

    expect(decisionFor(planned, subject)).toMatchObject({
      classification: 'unknown',
      reasons: [{ ruleId: 'no-rule-applies' }],
    })
  })

  it('gives every decision a reason and evidence', () => {
    const planned = plan(
      graph({
        units: [
          {
            id: 'fixture:src/lib/a.ts:utility:default',
            kind: 'utility',
            source: location('src/lib/a.ts'),
            dependencies: [],
          },
        ],
      }),
    )

    for (const decision of planned.decisions) {
      expect(decision.reasons.length).toBeGreaterThan(0)
      expect(decision.evidence.length).toBeGreaterThan(0)
    }
  })

  it('links a capability to its unit so the unit is classified by what it uses', () => {
    const subject = 'fixture:src/lib/store.ts:utility:default'
    const planned = plan(
      graph({
        units: [
          { id: subject, kind: 'utility', source: location('src/lib/store.ts'), dependencies: [] },
        ],
        capabilities: [
          {
            id: 'fixture:src/lib/store.ts:capability:local-storage:read',
            capability: 'local-storage',
            usage: 'read',
            source: location('src/lib/store.ts'),
          },
        ],
        edges: [
          {
            from: subject,
            to: 'fixture:src/lib/store.ts:capability:local-storage:read',
            kind: 'uses',
          },
        ],
      }),
    )

    expect(decisionFor(planned, subject)?.reasons[0]?.ruleId).toBe('unit-capability-bearing-logic')
  })
})

describe('rules, overrides and precedence', () => {
  it('lets a project override win over every rule', () => {
    const planned = plan(
      graph({
        units: [
          {
            id: 'fixture:src/App.vue:component:default',
            kind: 'component',
            source: location('src/App.vue'),
            dependencies: [],
          },
        ],
      }),
      {
        overrides: [{ match: 'src/App.vue', classification: 'web-fallback', reason: 'temporary' }],
      },
    )

    expect(planned.decisions[0]).toMatchObject({
      classification: 'web-fallback',
      reasons: [{ ruleId: 'override:src/App.vue' }],
    })
  })

  it('applies a declared layer rather than the order rules are given in', () => {
    const planned = plan(
      graph({
        units: [
          {
            id: 'fixture:src/App.vue:component:default',
            kind: 'component',
            source: location('src/App.vue'),
            dependencies: [],
          },
        ],
      }),
      {
        rules: [
          {
            id: 'from-a-target-provider',
            layer: 'target',
            applies: () => true,
            evaluate: () => ({
              classification: 'adaptable',
              confidence: 'high',
              message: 'the target has a better answer',
            }),
          },
        ],
      },
    )

    expect(planned.decisions[0]?.reasons[0]?.ruleId).toBe('from-a-target-provider')
  })

  it('produces the same plan twice, ordered by subject', () => {
    const built = graph({
      units: [
        {
          id: 'fixture:src/z.ts:utility:default',
          kind: 'utility',
          source: location('src/z.ts'),
          dependencies: [],
        },
        {
          id: 'fixture:src/a.ts:utility:default',
          kind: 'utility',
          source: location('src/a.ts'),
          dependencies: [],
        },
      ],
    })
    const first = plan(built)
    const second = plan(built)

    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
    expect(first.decisions.map((decision) => decision.subject)).toEqual([
      'fixture:src/a.ts:utility:default',
      'fixture:src/z.ts:utility:default',
    ])
  })
})

describe('planning with compatibility facts', () => {
  const dependency = (subject: string, name: string) => ({
    id: subject,
    name,
    version: '^1.0.0',
  })

  it('classifies a recorded package from its record, with the level in the evidence', () => {
    const subject = 'fixture:package.json:dependency:known'
    const planned = plan(graph({ dependencies: [dependency(subject, 'known')] }), {
      compatibility: new CompatibilityRegistry([
        {
          subject: { kind: 'package', name: 'known' },
          status: 'supported',
          evidence: [{ level: 'android-build-tested', source: 'somewhere real' }],
          notes: 'it was built',
        },
      ]),
    })

    expect(decisionFor(planned, subject)).toMatchObject({
      classification: 'portable',
      reasons: [{ ruleId: 'compatibility-record' }],
      evidence: [
        { kind: 'compat-registry', value: 'supported android-build-tested somewhere real' },
      ],
    })
    expect(planned.unknowns).not.toContain(subject)
  })

  it('never calls a blocked package portable', () => {
    const subject = 'fixture:package.json:dependency:blocked'
    const planned = plan(graph({ dependencies: [dependency(subject, 'blocked')] }), {
      compatibility: new CompatibilityRegistry([
        {
          subject: { kind: 'package', name: 'blocked' },
          status: 'blocked',
          evidence: [{ level: 'documented', source: 'its own documentation' }],
          notes: 'no native equivalent',
        },
      ]),
    })

    expect(decisionFor(planned, subject)?.classification).toBe('manual')
  })

  it('leaves a package with no record unknown, next to the ones that changed', () => {
    const planned = plan(
      graph({
        dependencies: [
          dependency('fixture:package.json:dependency:known', 'known'),
          dependency('fixture:package.json:dependency:unknown-one', 'unknown-one'),
        ],
      }),
      {
        compatibility: new CompatibilityRegistry([
          {
            subject: { kind: 'package', name: 'known' },
            status: 'not-applicable',
            evidence: [{ level: 'unit-tested', source: 'this repository' }],
            notes: 'native side',
          },
        ]),
      },
    )

    expect(decisionFor(planned, 'fixture:package.json:dependency:known')?.classification).toBe(
      'shared',
    )
    expect(decisionFor(planned, 'fixture:package.json:dependency:unknown-one')).toMatchObject({
      classification: 'unknown',
      reasons: [{ ruleId: 'dependency-compatibility-unknown' }],
    })
  })

  it('does not decide a unit from a record, only a dependency', () => {
    const subject = 'fixture:src/App.vue:component:default'
    const planned = plan(
      graph({
        units: [
          { id: subject, kind: 'component', source: location('src/App.vue'), dependencies: [] },
        ],
      }),
      {
        compatibility: new CompatibilityRegistry([
          {
            subject: { kind: 'package', name: 'App.vue' },
            status: 'supported',
            evidence: [{ level: 'unit-tested', source: 'nowhere' }],
            notes: 'not a package',
          },
        ]),
      },
    )

    expect(decisionFor(planned, subject)?.reasons[0]?.ruleId).toBe('unit-view-layer')
  })
})
