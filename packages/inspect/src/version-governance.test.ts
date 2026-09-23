import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AppGraphFragment } from '@memolabs-apps/graph'
import { loadSeedVersionMatrix } from '@memolabs-apps/compat'
import type { SourceAdapter, SourceInspection } from '@memolabs-apps/source'
import { SourceAdapterRegistry } from '@memolabs-apps/source'
import { describe, expect, it, vi } from 'vitest'
import { runInspection } from './index'

/**
 * The version governance contract suite.
 *
 * Discovery selects an adapter, the matrix governs the declared version, and
 * the diagnostic is either a graph or a deterministic refusal. The adapters
 * here are fakes with governed ids on purpose: this package is neutral, so
 * its tests must not reach for a framework, and the fixtures on disk carry
 * the real manifests, lockfiles and config snapshots.
 */

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

function versionFixture(adapterId: string, kind: string): string {
  return join(repoRoot, `packages/source-${adapterId}/fixtures`, kind)
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

function governedAdapter(
  id: string,
  spells: { inspect: () => Promise<SourceInspection>; buildGraph: () => Promise<AppGraphFragment> },
): SourceAdapter {
  return {
    id,
    displayName: id,
    supportLevel: 'experimental',
    testedVersions: [{ framework: id, versions: ['^1.0.0'] }],
    detect: () =>
      Promise.resolve({
        candidates: [{ confidence: 'high', evidence: [{ kind: 'fixture', value: 'fixture' }] }],
      }),
    inspect: spells.inspect,
    buildGraph: spells.buildGraph,
  }
}

function registryOf(...adapters: readonly SourceAdapter[]): SourceAdapterRegistry {
  const registry = new SourceAdapterRegistry()

  for (const adapter of adapters) {
    registry.register(adapter)
  }

  return registry
}

describe('version governance across discovery, graph and diagnosis', () => {
  it('inspects and graphs a positive fixture', async () => {
    const inspect = vi.fn(() => Promise.resolve(inspection('vue', 'Vue')))
    const buildGraph = vi.fn(() => Promise.resolve(emptyFragment()))
    const outcome = await runInspection({
      rootDir: versionFixture('vue', 'version-positive'),
      registry: registryOf(governedAdapter('vue', { inspect, buildGraph })),
    })

    expect(outcome.ok).toBe(true)
    expect(inspect).toHaveBeenCalledOnce()
    expect(buildGraph).toHaveBeenCalledOnce()
  })

  it('inspects and graphs a boundary fixture at the edge of the verified range', async () => {
    const inspect = vi.fn(() => Promise.resolve(inspection('angular', 'Angular')))
    const buildGraph = vi.fn(() => Promise.resolve(emptyFragment()))
    const outcome = await runInspection({
      rootDir: versionFixture('angular', 'version-boundary'),
      registry: registryOf(governedAdapter('angular', { inspect, buildGraph })),
    })

    expect(outcome.ok).toBe(true)
    expect(buildGraph).toHaveBeenCalledOnce()
  })

  it('refuses a refused fixture with outside-verified-range and generates nothing', async () => {
    const inspect = vi.fn(() => Promise.resolve(inspection('vue', 'Vue')))
    const buildGraph = vi.fn(() => Promise.resolve(emptyFragment()))
    const outcome = await runInspection({
      rootDir: versionFixture('vue', 'version-refused'),
      registry: registryOf(governedAdapter('vue', { inspect, buildGraph })),
    })

    expect(outcome.ok).toBe(false)

    if (outcome.ok) return

    expect(outcome.reason).toBe('outside-verified-range')
    expect(outcome.message).toContain('vue ^4.0.0')
    expect(outcome.message).toContain('package.json')
    expect(outcome.message).toContain('vue-single-file-component')
    expect(outcome.message).toContain('^3.5.0')
    expect(outcome.message).toContain('No application was generated')
    expect(inspect).not.toHaveBeenCalled()
    expect(buildGraph).not.toHaveBeenCalled()
  })

  it('refuses every refused fixture, one per governed adapter', async () => {
    for (const adapterId of ['vue', 'angular', 'react', 'svelte']) {
      const buildGraph = vi.fn(() => Promise.resolve(emptyFragment()))
      const outcome = await runInspection({
        rootDir: versionFixture(adapterId, 'version-refused'),
        registry: registryOf(
          governedAdapter(adapterId, {
            inspect: () => Promise.resolve(inspection(adapterId, adapterId)),
            buildGraph,
          }),
        ),
      })

      expect(outcome.ok).toBe(false)

      if (outcome.ok) continue

      expect(outcome.reason).toBe('outside-verified-range')
      expect(buildGraph).not.toHaveBeenCalled()
    }
  })

  it('refuses deterministically: the same refused fixture refuses the same way twice', async () => {
    const run = (): Promise<ReturnType<typeof runInspection>> =>
      runInspection({
        rootDir: versionFixture('react', 'version-refused'),
        registry: registryOf(
          governedAdapter('react', {
            inspect: () => Promise.resolve(inspection('react', 'React')),
            buildGraph: () => Promise.resolve(emptyFragment()),
          }),
        ),
      })

    expect(await run()).toEqual(await run())
  })

  it('exercises the Vue 4 requalification fixture without widening the range', async () => {
    const buildGraph = vi.fn(() => Promise.resolve(emptyFragment()))
    const outcome = await runInspection({
      rootDir: versionFixture('vue', 'version-requalification-vue4'),
      registry: registryOf(
        governedAdapter('vue', {
          inspect: () => Promise.resolve(inspection('vue', 'Vue')),
          buildGraph,
        }),
      ),
    })

    expect(outcome.ok).toBe(false)

    if (outcome.ok) return

    expect(outcome.reason).toBe('outside-verified-range')
    expect(outcome.message).toContain('vue ^4.0.0')
    expect(buildGraph).not.toHaveBeenCalled()
    expect(loadSeedVersionMatrix().verifiedRangesFor('vue', 'vue')).toEqual(['^3.5.0'])
  })

  it('leaves an adapter the matrix does not govern alone', async () => {
    const buildGraph = vi.fn(() => Promise.resolve(emptyFragment()))
    const outcome = await runInspection({
      rootDir: versionFixture('vue', 'version-refused'),
      registry: registryOf(
        governedAdapter('vanilla', {
          inspect: () => Promise.resolve(inspection('vanilla', 'Vanilla')),
          buildGraph,
        }),
      ),
    })

    expect(outcome.ok).toBe(true)
    expect(buildGraph).toHaveBeenCalledOnce()
  })
})
