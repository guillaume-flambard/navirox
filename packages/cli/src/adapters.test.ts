import { fileURLToPath } from 'node:url'
import { runInspection } from '@navirox/inspect'
import { describe, expect, it } from 'vitest'
import { createAdapterRegistry } from './cli'

/**
 * The gate.
 *
 * Two frameworks, one feature journey, one pipeline, one model. The assertions
 * are deliberately strict, because a comparison that only checked that both
 * reports exist would pass on two adapters that agree on nothing.
 *
 * The fixtures live inside the adapter packages and mirror each other component
 * for component. The registry is built from the shipped composition root, so a
 * passing run says the shipped adapter set can carry two frameworks, not just
 * that a test local to the adapters can.
 */

function fixture(packageName: string, name: string): string {
  return fileURLToPath(new URL(`../../${packageName}/fixtures/${name}`, import.meta.url))
}

/** The shape of a report, with everything a framework could leak into. */
function shape(report: Awaited<ReturnType<typeof runInspection>>): unknown {
  if (!report.ok) {
    throw new Error('the comparison was handed a failed inspection')
  }

  const { graph } = report.report

  return {
    nodeCollections: Object.keys(graph).sort(),
    unitKinds: [...new Set(graph.units.map((node) => node.kind))].sort(),
    unitKeys: [...new Set(graph.units.flatMap((node) => Object.keys(node)))].sort(),
    capabilityNodes: graph.capabilities.map((node) => `${node.capability}:${node.usage}`).sort(),
    dependencyKeys: [
      ...new Set(
        graph.dependencies.flatMap((node) => Object.keys(node).filter((key) => key !== 'id')),
      ),
    ].sort(),
  }
}

describe('the composition root', () => {
  it('registers every adapter it names', async () => {
    const registry = await createAdapterRegistry()

    expect(registry.list().map((adapter) => adapter.id)).toEqual(['svelte', 'sveltekit', 'vue'])
  })

  it('selects the meta-framework for a SvelteKit project', async () => {
    const registry = await createAdapterRegistry()
    const selected = await registry.select({
      rootDir: '',
      files: ['package.json'],
      readText: (path) =>
        path === 'package.json'
          ? JSON.stringify({ dependencies: { svelte: '^5.0.0', '@sveltejs/kit': '^2.0.0' } })
          : undefined,
    })

    expect(selected?.adapterId).toBe('sveltekit')
  })
})

describe('two frameworks through one pipeline', () => {
  it('produces reports that are structurally comparable', async () => {
    const registry = await createAdapterRegistry()
    const vue = await runInspection({
      rootDir: fixture('source-vue', 'vue-app'),
      registry,
      framework: 'vue',
    })
    const svelte = await runInspection({
      rootDir: fixture('source-svelte', 'svelte-app'),
      registry,
      framework: 'svelte',
    })

    expect(vue.ok).toBe(true)
    expect(svelte.ok).toBe(true)
    expect(shape(vue)).toEqual(shape(svelte))
  })

  it('reads the same capabilities from both projects', async () => {
    const registry = await createAdapterRegistry()
    const vue = await runInspection({
      rootDir: fixture('source-vue', 'vue-app'),
      registry,
      framework: 'vue',
    })
    const svelte = await runInspection({
      rootDir: fixture('source-svelte', 'svelte-app'),
      registry,
      framework: 'svelte',
    })

    if (!vue.ok || !svelte.ok) {
      throw new Error('both inspections have to succeed')
    }

    const capabilities = (report: typeof vue.report): string[] =>
      report.graph.capabilities.map((node) => `${node.capability}:${node.usage}`).sort()

    expect(capabilities(vue.report)).toEqual(capabilities(svelte.report))
    expect(capabilities(vue.report)).toContain('local-storage:read')
    expect(capabilities(vue.report)).toContain('geolocation:invoke')
  })

  it('finds a route only where a framework documents one', async () => {
    const registry = await createAdapterRegistry()
    const sveltekit = await runInspection({
      rootDir: fixture('source-sveltekit', 'sveltekit-app'),
      registry,
      framework: 'sveltekit',
    })
    const vue = await runInspection({
      rootDir: fixture('source-vue', 'vue-app'),
      registry,
      framework: 'vue',
    })

    if (!sveltekit.ok || !vue.ok) {
      throw new Error('both inspections have to succeed')
    }

    expect(sveltekit.report.graph.routes.map((route) => route.pathPattern)).toEqual([
      '/',
      '/about',
      '/blog/:slug',
    ])
    expect(vue.report.graph.routes).toEqual([])
  })

  it('did not have to move the shared schema for a second framework', async () => {
    const registry = await createAdapterRegistry()
    const vue = await runInspection({
      rootDir: fixture('source-vue', 'vue-app'),
      registry,
      framework: 'vue',
    })
    const sveltekit = await runInspection({
      rootDir: fixture('source-sveltekit', 'sveltekit-app'),
      registry,
      framework: 'sveltekit',
    })

    if (!vue.ok || !sveltekit.ok) {
      throw new Error('both inspections have to succeed')
    }

    // The report schema and the graph schema are the strongest available
    // statement that a second framework did not force the model to move.
    expect(vue.report.schemaVersion).toBe(1)
    expect(vue.report.graph.schemaVersion).toBe(1)
    expect(sveltekit.report.graph.schemaVersion).toBe(1)
  })
})
