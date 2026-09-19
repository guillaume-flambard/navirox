import { fileURLToPath } from 'node:url'
import {
  SourceAdapterRegistry,
  createProjectFiles,
  verifyAdapterContract,
} from '@memolabs-apps/source'
import { createSvelteAdapter } from '@memolabs-apps/source-svelte'
import { describe, expect, it } from 'vitest'
import { buildGraph, createSvelteKitAdapter, detect, routePattern } from './index'

function fixture(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))
}

const adapter = createSvelteKitAdapter()

describe('detecting SvelteKit', () => {
  it('matches a project that declares it, with manifest evidence', async () => {
    const result = await detect(createProjectFiles(fixture('sveltekit-app')))

    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0]?.evidence[0]?.value).toContain('dependencies.@sveltejs/kit')
  })

  it('does not match a plain Svelte project', async () => {
    const result = await detect(
      createProjectFiles(
        fileURLToPath(new URL('../../source-svelte/fixtures/svelte-app', import.meta.url)),
      ),
    )

    expect(result.candidates).toEqual([])
  })

  it('composes the Svelte adapter and is preferred over it', async () => {
    const registry = new SourceAdapterRegistry()
    registry.register(createSvelteAdapter())
    registry.register(adapter)

    const selected = await registry.select(createProjectFiles(fixture('sveltekit-app')))

    expect(adapter.composes).toEqual(['svelte'])
    expect(selected?.adapterId).toBe('sveltekit')
  })
})

describe('reading routes', () => {
  it('turns a directory path into a URL, and a bracket segment into a parameter', () => {
    expect(routePattern('src/routes/+page.svelte')).toEqual({ pattern: '/', params: [] })
    expect(routePattern('src/routes/about/+page.svelte')).toEqual({
      pattern: '/about',
      params: [],
    })
    expect(routePattern('src/routes/blog/[slug]/+page.svelte')).toEqual({
      pattern: '/blog/:slug',
      params: ['slug'],
    })
    expect(routePattern('src/routes/docs/[[lang]]/+page.svelte')).toEqual({
      pattern: '/docs/:lang',
      params: ['lang'],
    })
  })

  it('reads the routes a project establishes', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('sveltekit-app')))

    expect(inspection.routes.map((route) => route.pathPattern)).toEqual([
      '/',
      '/about',
      '/blog/:slug',
    ])
    expect(inspection.routes.every((route) => route.source.file.endsWith('.svelte'))).toBe(true)
  })

  it('names the parameter it found', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('sveltekit-app')))
    const blog = inspection.routes.find((route) => route.pathPattern === '/blog/:slug')

    expect(blog?.params).toEqual(['slug'])
  })

  it('reports a layout, a server page, an error page and an endpoint without making routes', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('sveltekit-bad')))
    const routes = inspection.routes.map((route) => route.pathPattern)
    const codes = inspection.findings
      .filter((finding) => finding.code.startsWith('route-file'))
      .map((finding) => finding.code)

    expect(routes).toEqual(['/:id'])
    expect(codes.length).toBeGreaterThanOrEqual(3)
    expect(
      inspection.findings.some((finding) => finding.source?.file.endsWith('+page.server.ts')),
    ).toBe(true)
  })

  it('produces no route for a page outside the routes directory', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('sveltekit-bad')))

    expect(inspection.routes.some((route) => route.source.file.includes('components/orphan'))).toBe(
      false,
    )
    expect(inspection.routes.map((route) => route.pathPattern)).not.toContain('/orphan')
  })
})

describe('the SvelteKit reading as a graph', () => {
  it('names this adapter in every identifier, including the composed component reading', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('sveltekit-app')))
    const graph = await buildGraph(inspection)
    const ids = [
      ...graph.units.map((node) => node.id),
      ...graph.capabilities.map((node) => node.id),
      ...graph.routes.map((node) => node.id),
    ]

    expect(ids.length).toBeGreaterThan(0)
    expect(ids.every((id) => id.startsWith('sveltekit:'))).toBe(true)
    expect(graph.routes.map((route) => route.pathPattern)).toEqual(['/', '/about', '/blog/:slug'])
  })

  it('is deterministic', async () => {
    const first = await adapter.inspect(createProjectFiles(fixture('sveltekit-app')))
    const second = await adapter.inspect(createProjectFiles(fixture('sveltekit-app')))

    expect(JSON.stringify(await buildGraph(first))).toBe(JSON.stringify(await buildGraph(second)))
  })
})

describe('the SvelteKit adapter against the adapter contract', () => {
  it('reports no violation', async () => {
    const violations = await verifyAdapterContract(
      adapter,
      createProjectFiles(fixture('sveltekit-app')),
    )

    expect(violations).toEqual([])
  })
})
