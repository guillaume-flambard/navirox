import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SourceAdapterRegistry,
  createProjectFiles,
  verifyAdapterContract,
} from '@memolabs-apps/source'
import { createVueAdapter } from '@memolabs-apps/source-vue'
import { describe, expect, it } from 'vitest'
import { buildGraph, createNuxtAdapter, detect, pagePattern } from './index'

function fixture(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))
}

const adapter = createNuxtAdapter()

describe('detecting Nuxt', () => {
  it('matches with manifest evidence and composes the Vue adapter', async () => {
    const result = await detect(createProjectFiles(fixture('nuxt-app')))

    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0]?.evidence[0]?.value).toContain('dependencies.nuxt')
    expect(adapter.composes).toEqual(['vue'])
  })

  it('returns no candidate without a manifest', async () => {
    expect(
      (await detect(createProjectFiles(mkdtempSync(join(tmpdir(), 'nuxt-'))))).candidates,
    ).toEqual([])
  })

  it('is preferred over the Vue adapter', async () => {
    const registry = new SourceAdapterRegistry()
    registry.register(createVueAdapter())
    registry.register(adapter)

    expect((await registry.select(createProjectFiles(fixture('nuxt-app'))))?.adapterId).toBe('nuxt')
  })
})

describe('reading Nuxt routes', () => {
  it('turns a page path into a URL', () => {
    expect(pagePattern('src/pages/index.vue', 'src/pages')).toEqual({ pattern: '/', params: [] })
    expect(pagePattern('src/pages/about.vue', 'src/pages')).toEqual({
      pattern: '/about',
      params: [],
    })
    expect(pagePattern('src/pages/blog/index.vue', 'src/pages')).toEqual({
      pattern: '/blog',
      params: [],
    })
    expect(pagePattern('src/pages/blog/[slug].vue', 'src/pages')).toEqual({
      pattern: '/blog/:slug',
      params: ['slug'],
    })
    expect(pagePattern('src/pages/docs/[[lang]].vue', 'src/pages')).toEqual({
      pattern: '/docs/:lang',
      params: ['lang'],
    })
    expect(pagePattern('src/pages/user-[id].vue', 'src/pages')).toEqual({
      pattern: '/user-:id',
      params: ['id'],
    })
  })

  it('reads the routes the fixture establishes', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('nuxt-app')))

    expect(inspection.routes.map((route) => route.pathPattern)).toEqual([
      '/',
      '/about',
      '/blog',
      '/blog/:slug',
      '/docs/:lang',
    ])
  })

  it('reads pages from the project root as well as from src', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('nuxt-bad')))

    expect(inspection.routes.map((route) => route.pathPattern)).toEqual(['/', '/:id'])
  })
})

describe('layouts and composables', () => {
  it('reports a layout as a layout unit and a composable as a utility unit', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('nuxt-app')))
    const kinds = inspection.units.map((unit) => `${unit.kind}:${unit.source.file}`)

    expect(kinds).toContain('layout:src/layouts/default.vue')
    expect(kinds).toContain('utility:src/composables/useRows.ts')
  })

  it('still reports the components the Vue adapter read', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('nuxt-app')))
    const files = inspection.units
      .filter((unit) => unit.kind === 'component')
      .map((unit) => unit.source.file)

    expect(files).toContain('src/pages/index.vue')
    expect(files).toContain('src/components/List.vue')
  })

  it('reports the state module the Vue adapter read', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('nuxt-app')))

    expect(
      inspection.units.some(
        (unit) => unit.kind === 'state-module' && unit.source.file === 'src/stores/counter.ts',
      ),
    ).toBe(true)
  })
})

describe('the surface this adapter refuses to model', () => {
  it('reports server code, plugins, middleware and the runtime config without making units of them', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('nuxt-app')))
    const codes = inspection.findings.map((finding) => finding.code)
    const files = inspection.findings.map((finding) => finding.source?.file)

    expect(codes).toContain('nuxt-server-code')
    expect(codes).toContain('nuxt-plugin')
    expect(codes).toContain('nuxt-middleware')
    expect(codes).toContain('nuxt-runtime-config')
    expect(files).toContain('src/server/api/rows.ts')
    expect(inspection.units.some((unit) => unit.source.file.startsWith('src/server/'))).toBe(false)
    expect(inspection.routes.some((route) => route.source.file.startsWith('src/server/'))).toBe(
      false,
    )
  })
})

describe('data fetching', () => {
  it('is the shared network request capability, not a capability of its own', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('nuxt-app')))
    const page = inspection.capabilities.filter(
      (capability) => capability.source.file === 'src/pages/index.vue',
    )

    expect(page.map((capability) => `${capability.capability}:${capability.usage}`)).toEqual([
      'network-request:invoke',
    ])
  })
})

describe('the Nuxt reading as a graph', () => {
  it('names this adapter on every node, including composed ones, and is deterministic', async () => {
    const first = await adapter.inspect(createProjectFiles(fixture('nuxt-app')))
    const second = await adapter.inspect(createProjectFiles(fixture('nuxt-app')))
    const graph = await buildGraph(first)
    const ids = [
      ...graph.units.map((node) => node.id),
      ...graph.routes.map((node) => node.id),
      ...graph.capabilities.map((node) => node.id),
    ]

    expect(JSON.stringify(await buildGraph(second))).toBe(JSON.stringify(graph))
    expect(ids.every((id) => id.startsWith('nuxt:'))).toBe(true)
    expect(graph.routes).toHaveLength(5)
  })

  it('reports the old major it was not tested against', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('nuxt-bad')))

    expect(inspection.findings.map((finding) => finding.code)).toContain('version-untested')
  })
})

describe('the Nuxt adapter against the adapter contract', () => {
  it('reports no violation', async () => {
    expect(await verifyAdapterContract(adapter, createProjectFiles(fixture('nuxt-app')))).toEqual(
      [],
    )
  })
})

describe('the application directory Nuxt 4 documents', () => {
  const app = createProjectFiles(fixture('nuxt4-app'))

  it('reads pages, layouts and the runtime surface from app/', async () => {
    const inspection = await adapter.inspect(app)
    const routes = inspection.routes.map((route) => route.pathPattern).sort()
    const codes = inspection.findings.map((finding) => finding.code)

    expect(routes).toEqual(['/', '/a/:slug', '/dashboard', '/posts/:slug', '/settings'])
    expect(inspection.units.some((unit) => unit.kind === 'layout' && unit.name === 'admin')).toBe(
      true,
    )
    expect(codes).toContain('nuxt-middleware')
    expect(codes).toContain('nuxt-plugin')
  })

  it('lets definePageMeta decide the path and add aliases', async () => {
    const inspection = await adapter.inspect(app)
    const paths = inspection.routes.map((route) => route.pathPattern)

    expect(paths).toContain('/posts/:slug')
    expect(paths).toContain('/a/:slug')
    expect(paths).not.toContain('/articles/:slug')
  })

  it('keeps the page metadata in adapter metadata and not in the model', async () => {
    const inspection = await adapter.inspect(app)
    const page = inspection.units.find(
      (unit) => unit.source.file === 'app/pages/articles/[slug].vue',
    )
    const graph = await buildGraph(inspection)

    expect(page?.metadata?.page).toEqual({
      layout: 'admin',
      middleware: ['auth'],
      path: '/posts/:slug',
      aliases: ['/a/:slug'],
    })
    expect(Object.keys(graph).sort()).toEqual(
      [
        'actions',
        'capabilities',
        'data',
        'dependencies',
        'edges',
        'findings',
        'routes',
        'screens',
        'units',
      ].sort(),
    )
  })

  it('keeps one route when two page roots claim the same path', async () => {
    const inspection = await adapter.inspect(app)
    const dashboards = inspection.routes.filter((route) => route.pathPattern === '/dashboard')
    const collision = inspection.findings.find(
      (finding) => finding.code === 'nuxt-page-path-collision',
    )

    expect(dashboards).toHaveLength(1)
    expect(dashboards[0]?.source.file).toBe('app/pages/dashboard.vue')
    expect(collision?.message).toContain('pages/dashboard.vue')
  })

  it('reports a page that names a layout or a middleware that does not exist', async () => {
    const inspection = await adapter.inspect(app)
    const missing = inspection.findings.filter((finding) =>
      ['nuxt-page-layout-missing', 'nuxt-page-middleware-missing'].includes(finding.code),
    )

    expect(missing.map((finding) => finding.code).sort()).toEqual([
      'nuxt-page-layout-missing',
      'nuxt-page-middleware-missing',
    ])
    expect(missing.every((finding) => finding.source?.file === 'app/pages/settings.vue')).toBe(true)
  })

  it('reads the two halves of a component as two runtimes', async () => {
    const inspection = await adapter.inspect(app)
    const client = inspection.units.find(
      (unit) => unit.source.file === 'app/components/Comments.client.vue',
    )
    const server = inspection.units.filter(
      (unit) => unit.source.file === 'app/components/Heavy.server.vue',
    )

    expect(server).toEqual([])
    expect(client?.metadata?.rendersOnlyOnClient).toBe(true)
    expect(inspection.findings.some((finding) => finding.code === 'nuxt-server-component')).toBe(
      true,
    )
  })

  it('names the application config apart from the runtime config', async () => {
    const inspection = await adapter.inspect(app)
    const codes = inspection.findings.map((finding) => finding.code)

    expect(codes).toContain('nuxt-app-config')
    expect(codes).toContain('nuxt-runtime-config')
  })

  it('produces the same graph twice, all of it named after this adapter', async () => {
    const first = await adapter.inspect(app)
    const graph = await buildGraph(first)
    const ids = [...graph.units.map((node) => node.id), ...graph.routes.map((node) => node.id)]

    expect(JSON.stringify(await buildGraph(await adapter.inspect(app)))).toBe(JSON.stringify(graph))
    expect(ids.every((id) => id.startsWith('nuxt:'))).toBe(true)
  })
})
