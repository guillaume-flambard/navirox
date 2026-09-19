import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProjectFiles, verifyAdapterContract } from '@memolabs-apps/source'
import { describe, expect, it } from 'vitest'
import {
  ADAPTER_ID,
  buildGraph,
  createNextAdapter,
  declaredBoundary,
  detect,
  isPageOrLayout,
  isServerSurface,
  readRoutes,
  urlPattern,
} from './index'

function fixture(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))
}

function project(manifest: Record<string, unknown>): string {
  const directory = mkdtempSync(join(tmpdir(), 'navirox-next-'))
  writeFileSync(join(directory, 'package.json'), JSON.stringify(manifest))
  return directory
}

const adapter = createNextAdapter()
const app = createProjectFiles(fixture('next-app'))
const bad = createProjectFiles(fixture('next-bad'))

describe('detecting Next, and refusing the target', () => {
  it('matches a Next project with manifest evidence', async () => {
    const result = await detect(app)

    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0]?.evidence[0]?.value).toContain('dependencies.next')
  })

  it('declares the React adapter it composes', () => {
    expect(adapter.composes).toEqual(['react'])
    expect(adapter.testedVersions).toEqual([{ framework: 'next', versions: ['^15.0.0'] }])
  })

  it('yields no candidate without Next, and does not throw', async () => {
    expect(
      (await detect(createProjectFiles(project({ dependencies: { react: '^19.0.0' } }))))
        .candidates,
    ).toEqual([])
    expect(
      (await detect(createProjectFiles(mkdtempSync(join(tmpdir(), 'navirox-n-'))))).candidates,
    ).toEqual([])
  })

  it('refuses a project that declares the native runtime', async () => {
    const result = await detect(
      createProjectFiles(project({ dependencies: { next: '^15.0.0', 'react-native': '^0.76.0' } })),
    )

    expect(result.candidates).toEqual([])
  })

  it('refuses a project that declares a native module', async () => {
    const result = await detect(
      createProjectFiles(
        project({ dependencies: { next: '^15.0.0', '@symbiote-native/vue': '2.0.0' } }),
      ),
    )

    expect(result.candidates).toEqual([])
  })
})

describe('reading both routers', () => {
  it('reads an App Router page as the directory it lives in', () => {
    const { pattern } = urlPattern(['about'])

    expect(pattern).toBe('/about')
  })

  it('reads the App Router root page as the root', () => {
    expect(urlPattern([]).pattern).toBe('/')
  })

  it('reads a bracketed segment as a parameter', () => {
    expect(urlPattern(['blog', '[slug]'])).toEqual({ pattern: '/blog/:slug', params: ['slug'] })
    expect(urlPattern(['users', '[...rest]'])).toEqual({
      pattern: '/users/:rest',
      params: ['rest'],
    })
  })

  it('omits a route group from the URL', () => {
    expect(urlPattern(['(marketing)', 'pricing']).pattern).toBe('/pricing')
  })

  it('reads a Pages Router module as its file path', () => {
    const reading = readRoutes(bad.files)
    const patterns = reading.routes.map((route) => route.pathPattern)

    expect(patterns).toContain('/')
    expect(patterns).toContain('/dashboard')
  })

  it('reads both routers into one route set', () => {
    const patterns = readRoutes(app.files).routes.map((route) => route.pathPattern)

    expect(patterns).toEqual(['/', '/about', '/blog/:slug', '/dashboard', '/pricing', '/profile'])
  })

  it('tells a page and a layout from the other files', () => {
    expect(isPageOrLayout('app/page.tsx')).toBe(true)
    expect(isPageOrLayout('app/dashboard/page.tsx')).toBe(true)
    expect(isPageOrLayout('app/layout.tsx')).toBe(true)
    expect(isPageOrLayout('app/api/rows/route.ts')).toBe(false)
    expect(isPageOrLayout('pages/index.tsx')).toBe(true)
    expect(isPageOrLayout('pages/_app.tsx')).toBe(false)
    expect(isPageOrLayout('pages/api/legacy.ts')).toBe(false)
    expect(isPageOrLayout('src/lib/api.ts')).toBe(false)
  })

  it('reports the files that are not routes instead of silently dropping them', () => {
    const codes = readRoutes(bad.files).findings.map((finding) => finding.code)

    expect(codes).toContain('next-pages-special')
    expect(codes).toContain('next-api-route')
  })
})

describe('the module boundary is metadata, not a finding', () => {
  it('reads the directive a file declares', () => {
    expect(declaredBoundary(`'use client'\n\nexport default function Page() {}`)).toBe('client')
    expect(declaredBoundary('"use server"\nexport async function load() {}')).toBe('server')
    expect(declaredBoundary('export default function Page() {}')).toBeUndefined()
  })

  it('records the boundary on the units it describes and never as a finding', async () => {
    const inspection = await adapter.inspect(app)
    const dashboard = inspection.units.find((unit) => unit.source.file === 'app/dashboard/page.tsx')
    const home = inspection.units.find((unit) => unit.source.file === 'app/page.tsx')

    expect(dashboard?.metadata?.boundary).toBe('client')
    expect(home?.metadata?.boundary).toBe('server')
    expect(inspection.findings.filter((finding) => finding.code.includes('boundary'))).toEqual([])
  })

  it('never turns an App Router unit without a directive into a finding', async () => {
    const inspection = await adapter.inspect(app)
    const about = inspection.units.find((unit) => unit.source.file === 'app/about/page.tsx')

    expect(about?.metadata?.boundary).toBe('server')
    expect(inspection.findings.map((finding) => finding.code)).not.toContain('next-client-boundary')
  })
})

describe('the server surface is reported, never read as application code', () => {
  it('recognises the files that run outside the browser', () => {
    expect(isServerSurface('app/api/rows/route.ts')).toBe(true)
    expect(isServerSurface('pages/api/legacy.ts')).toBe(true)
    expect(isServerSurface('middleware.ts')).toBe(true)
    expect(isServerSurface('next.config.ts')).toBe(true)
    expect(isServerSurface('app/page.tsx')).toBe(false)
    expect(isServerSurface('src/lib/api.ts')).toBe(false)
  })

  it('reports each one as a finding and as no unit', async () => {
    const inspection = await adapter.inspect(app)
    const reported = inspection.findings
      .filter((finding) => finding.code === 'next-server-surface')
      .map((finding) => finding.source?.file)
      .sort()

    expect(reported).toEqual(['app/api/rows/route.ts', 'middleware.ts', 'next.config.ts'])
    expect(inspection.units.some((unit) => isServerSurface(unit.source.file))).toBe(false)
    expect(inspection.routes.some((route) => isServerSurface(route.source.file))).toBe(false)
  })
})

describe('layouts and the rest of the reading', () => {
  it('reports a layout as a unit of kind layout', async () => {
    const inspection = await adapter.inspect(app)
    const layouts = inspection.units.filter((unit) => unit.kind === 'layout')

    expect(layouts.map((unit) => unit.source.file)).toEqual(['app/layout.tsx'])
  })

  it('keeps the React adapter reading of components, state and utilities', async () => {
    const inspection = await adapter.inspect(app)
    const kinds = [...new Set(inspection.units.map((unit) => unit.kind))].sort()

    expect(kinds).toEqual(['component', 'layout', 'state-module', 'utility'])
    expect(inspection.capabilities.map((capability) => capability.capability).sort()).toEqual([
      'geolocation',
      'local-storage',
      'local-storage',
      'local-storage',
      'network-request',
    ])
  })

  it('names the untested versions it was given rather than implying support', async () => {
    const inspection = await adapter.inspect(bad)
    const untested = inspection.findings.filter((finding) => finding.code === 'version-untested')

    expect(untested.length).toBeGreaterThanOrEqual(1)
    expect(untested.map((finding) => finding.message).join(' ')).toContain('^13.0.0')
  })
})

describe('the graph, and the contract', () => {
  it('maps the reading with this adapter id', async () => {
    const inspection = await adapter.inspect(app)
    const fragment = await buildGraph(inspection)
    const nodes = [...fragment.routes, ...fragment.units, ...fragment.screens]

    expect(nodes.length).toBeGreaterThan(0)
    expect(nodes.every((node) => node.id.startsWith(`${ADAPTER_ID}:`))).toBe(true)
  })

  it('builds the same graph twice', async () => {
    const first = await buildGraph(await adapter.inspect(app))
    const second = await buildGraph(await adapter.inspect(app))

    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })

  it('satisfies the shared adapter contract on both fixtures', async () => {
    expect(await verifyAdapterContract(adapter, app)).toEqual([])
    expect(await verifyAdapterContract(adapter, bad)).toEqual([])
  })

  it('turns an unsupported input into findings rather than a failure', async () => {
    const empty = createProjectFiles(mkdtempSync(join(tmpdir(), 'navirox-next-empty-')))
    const inspection = await adapter.inspect(empty)

    expect(inspection.units).toEqual([])
    expect(inspection.routes).toEqual([])
    expect(inspection.findings.length).toBeGreaterThan(0)
  })
})
