import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AppGraphFragment } from '@memolabs-apps/graph'
import type { SourceAdapter, SourceInspection } from '@memolabs-apps/source'
import { SourceAdapterRegistry } from '@memolabs-apps/source'
import { describe, expect, it, vi } from 'vitest'
import { renderFailure, renderReport, reportToJson, runInspection } from './index'

/**
 * The pipeline is tested with a fake adapter on purpose.
 *
 * This package is on the neutral side of the seam, so its tests must not reach
 * for a framework. A fake is also the only way to exercise a failure the real
 * adapters are forbidden from producing, such as an adapter that throws.
 */

function project(): string {
  const directory = mkdtempSync(join(tmpdir(), 'navirox-inspect-'))
  writeFileSync(join(directory, 'index.ts'), 'export const app = 1\n')
  return directory
}

function emptyFragment(): AppGraphFragment {
  return {
    routes: [],
    screens: [],
    units: [],
    actions: [],
    data: [],
    capabilities: [],
    dependencies: [],
    edges: [],
    findings: [],
  }
}

function inspection(adapterId: string, displayName: string): SourceInspection {
  return {
    descriptor: { adapterId, displayName },
    units: [],
    capabilities: [],
    dependencies: [],
    routes: [],
    findings: [],
  }
}

function fakeAdapter(overrides: Partial<SourceAdapter> = {}): SourceAdapter {
  const id = overrides.id ?? 'fake'

  return {
    id,
    displayName: 'Fake',
    supportLevel: 'experimental',
    testedVersions: [{ framework: 'fake', versions: ['^1.0.0'] }],
    detect: () =>
      Promise.resolve({
        candidates: [{ confidence: 'high', evidence: [{ kind: 'fixture', value: 'fixture' }] }],
      }),
    inspect: () => Promise.resolve(inspection(id, 'Fake')),
    buildGraph: () => Promise.resolve(emptyFragment()),
    ...overrides,
  }
}

function registryOf(...adapters: readonly SourceAdapter[]): SourceAdapterRegistry {
  const registry = new SourceAdapterRegistry()

  for (const adapter of adapters) {
    registry.register(adapter)
  }

  return registry
}

describe('running an inspection', () => {
  it('selects the adapter and names it in the report', async () => {
    const outcome = await runInspection({ rootDir: project(), registry: registryOf(fakeAdapter()) })

    expect(outcome.ok).toBe(true)
    if (outcome.ok) {
      expect(outcome.report.source.adapterId).toBe('fake')
      expect(outcome.report.supportLevel).toBe('experimental')
      expect(outcome.report.schemaVersion).toBe(1)
    }
  })

  it('reports the absence of an adapter instead of falling back', async () => {
    const silent = fakeAdapter({ id: 'silent', detect: () => Promise.resolve({ candidates: [] }) })
    const outcome = await runInspection({ rootDir: project(), registry: registryOf(silent) })

    expect(outcome.ok).toBe(false)
    if (!outcome.ok) {
      expect(outcome.reason).toBe('no-adapter')
      expect(outcome.available).toEqual(['silent'])
    }
  })

  it('names an unknown adapter and lists what exists', async () => {
    const outcome = await runInspection({
      rootDir: project(),
      registry: registryOf(fakeAdapter()),
      framework: 'svelte',
    })

    expect(outcome.ok).toBe(false)
    if (!outcome.ok) {
      expect(outcome.reason).toBe('unknown-adapter')
      expect(outcome.message).toContain('svelte')
      expect(outcome.available).toEqual(['fake'])
    }
  })

  it('lets an explicit identifier bypass detection', async () => {
    const plain = fakeAdapter({ id: 'plain' })
    const chosen = fakeAdapter({
      id: 'chosen',
      detect: () => Promise.resolve({ candidates: [] }),
    })
    const outcome = await runInspection({
      rootDir: project(),
      registry: registryOf(plain, chosen),
      framework: 'chosen',
    })

    expect(outcome.ok).toBe(true)
    if (outcome.ok) {
      expect(outcome.report.source.adapterId).toBe('chosen')
    }
  })

  it('requires an explicit adapter for unrelated equal-confidence detections', async () => {
    const outcome = await runInspection({
      rootDir: project(),
      registry: registryOf(fakeAdapter({ id: 'angular' }), fakeAdapter({ id: 'react' })),
    })

    expect(outcome.ok).toBe(false)
    if (!outcome.ok) {
      expect(outcome.reason).toBe('ambiguous-adapter')
      expect(outcome.message).toContain('--framework angular')
      expect(outcome.message).toContain('--framework react')
    }
  })

  it('turns an adapter that throws into a failure rather than an exception', async () => {
    const broken = fakeAdapter({
      inspect: () => Promise.reject(new Error('the parser exploded')),
    })
    const outcome = await runInspection({ rootDir: project(), registry: registryOf(broken) })

    expect(outcome.ok).toBe(false)
    if (!outcome.ok) {
      expect(outcome.reason).toBe('adapter-failed')
      expect(outcome.message).toContain('the parser exploded')
    }
  })

  it('counts what came back and carries the graph envelope', async () => {
    const readOnce: SourceInspection = {
      descriptor: { adapterId: 'fake', displayName: 'Fake' },
      units: [
        { key: 'default', kind: 'component', source: { file: 'App.vue', adapterId: 'fake' } },
      ],
      capabilities: [
        {
          key: 'local-storage:read',
          capability: 'local-storage',
          usage: 'read',
          source: { file: 'App.vue', adapterId: 'fake' },
        },
      ],
      dependencies: [{ key: 'vue', name: 'vue', version: '^3.5.43' }],
      routes: [],
      findings: [
        {
          id: 'fake:finding:sample:one',
          code: 'sample',
          severity: 'warning',
          title: 'A sample finding',
          message: 'Something could not be established.',
          evidence: [{ kind: 'source', value: 'App.vue' }],
        },
      ],
    }

    const adapter = fakeAdapter({
      inspect: () => Promise.resolve(readOnce),
      // A real adapter maps its reading into nodes; the pipeline only counts them.
      buildGraph: (reading) =>
        Promise.resolve({
          ...emptyFragment(),
          units: reading.units.map((unit) => ({
            id: `fake:${unit.source.file}:${unit.kind}:${unit.key}`,
            kind: unit.kind,
            source: unit.source,
            dependencies: [],
          })),
          capabilities: reading.capabilities.map((capability) => ({
            id: `fake:${capability.source.file}:capability:${capability.key}`,
            capability: capability.capability,
            usage: capability.usage,
            source: capability.source,
          })),
          dependencies: reading.dependencies.map((dependency) => ({
            id: `fake:package.json:dependency:${dependency.key}`,
            name: dependency.name,
            ...(dependency.version === undefined ? {} : { version: dependency.version }),
          })),
          findings: reading.findings,
        }),
    })
    const outcome = await runInspection({ rootDir: project(), registry: registryOf(adapter) })

    expect(outcome.ok).toBe(true)
    if (outcome.ok) {
      expect(outcome.report.summary.units).toBe(1)
      expect(outcome.report.summary.capabilities).toBe(1)
      expect(outcome.report.summary.dependencies).toBe(1)
      expect(outcome.report.summary.findings).toEqual({ info: 0, warning: 1, error: 0 })
      expect(outcome.report.graph.schemaVersion).toBe(1)
      expect(outcome.report.graph.source.adapterId).toBe('fake')
    }
  })

  it('produces the same report twice for an unchanged project', async () => {
    const rootDir = project()
    const adapter = fakeAdapter()
    const first = await runInspection({ rootDir, registry: registryOf(adapter) })
    const second = await runInspection({ rootDir, registry: registryOf(adapter) })

    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })

  it('returns data without printing', async () => {
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

    await runInspection({ rootDir: project(), registry: registryOf(fakeAdapter()) })

    expect(write).not.toHaveBeenCalled()
    write.mockRestore()
  })
})

describe('rendering a report', () => {
  it('answers the inspection questions in order', async () => {
    const rootDir = project()
    const outcome = await runInspection({ rootDir, registry: registryOf(fakeAdapter()) })

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) {
      return
    }

    const text = renderReport(outcome.report)

    expect(text).toContain(rootDir)
    expect(text).toContain('Fake (experimental)')
    expect(text).toContain('Found')
    expect(text).toContain('Not determined')
    expect(text).toContain('Next')
  })

  it('renders one JSON document', async () => {
    const outcome = await runInspection({ rootDir: project(), registry: registryOf(fakeAdapter()) })

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) {
      return
    }

    const parsed: unknown = JSON.parse(reportToJson(outcome.report))

    expect(typeof parsed).toBe('object')
    expect(reportToJson(outcome.report).split('\n')[0]).toBe('{')
  })

  it('renders a failure as JSON when JSON was asked for', async () => {
    const outcome = await runInspection({ rootDir: project(), registry: registryOf() })
    const rendered = JSON.parse(renderFailure(outcome, true)) as { reason: string }

    expect(rendered.reason).toBe('no-adapter')
    expect(renderFailure(outcome, false)).toContain('No source adapters are registered')
  })

  it('renders an adapter observation in the adapter own words', async () => {
    const file = 'src/app/thing.component.ts'
    const adapter = fakeAdapter({
      inspect: () =>
        Promise.resolve({
          ...inspection('fake', 'Fake'),
          units: [{ key: 'default', kind: 'component', source: { file, adapterId: 'fake' } }],
        }),
      buildGraph: () =>
        Promise.resolve({
          ...emptyFragment(),
          units: [
            {
              id: `fake:${file}:component:default`,
              kind: 'component',
              source: { file, adapterId: 'fake' },
              dependencies: [],
              metadata: {
                mobileReadiness: {
                  state: 'candidate',
                  rule: 'attachment-signal',
                  reason: 'An attachment control was observed in this unit.',
                  evidence: [file],
                },
                externalTemplate: true,
              },
            },
          ],
        }),
    })

    const outcome = await runInspection({ rootDir: project(), registry: registryOf(adapter) })

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) {
      return
    }

    const text = renderReport(outcome.report)

    expect(text).toContain('Observations (1)')
    expect(text).toContain(`candidate ${file} (mobileReadiness)`)
    expect(text).toContain('An attachment control was observed in this unit.')
    expect(text).not.toContain('portable')
    expect(text).not.toContain('externalTemplate')
  })

  it('prints no observation section when no adapter attached one', async () => {
    const outcome = await runInspection({ rootDir: project(), registry: registryOf(fakeAdapter()) })

    expect(outcome.ok).toBe(true)
    if (!outcome.ok) {
      return
    }

    expect(renderReport(outcome.report)).not.toContain('Observations')
  })
})
