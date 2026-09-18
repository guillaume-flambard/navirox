import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProjectFiles, verifyAdapterContract } from '@navirox/source'
import { describe, expect, it } from 'vitest'
import {
  ADAPTER_ID,
  buildGraph,
  createQwikAdapter,
  detect,
  inspect,
  isRoutesFile,
  readDeclaration,
  readRoutes,
  urlPattern,
} from './index'

function fixture(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))
}

function project(manifest: Record<string, unknown>): string {
  const directory = mkdtempSync(join(tmpdir(), 'navirox-qwik-'))
  writeFileSync(join(directory, 'package.json'), JSON.stringify(manifest))
  return directory
}

const adapter = createQwikAdapter()
const app = createProjectFiles(fixture('qwik-app'))
const bad = createProjectFiles(fixture('qwik-bad'))

describe('detecting Qwik, and refusing the target', () => {
  it('claims a project that declares the framework', async () => {
    const result = await detect(app)

    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0]?.confidence).toBe('high')
    expect(result.candidates[0]?.evidence[0]?.kind).toBe('manifest')
    expect(result.candidates[0]?.evidence[0]?.value).toContain('dependencies.@builder.io/qwik')
  })

  it('declares the version line it was exercised against', () => {
    expect(adapter.testedVersions).toEqual([
      { framework: '@builder.io/qwik', versions: ['^1.20.0'] },
    ])
    expect(adapter.composes).toBeUndefined()
  })

  it('does not claim a project that does not declare it', async () => {
    expect(
      (await detect(createProjectFiles(project({ dependencies: { vue: '^3.5.0' } })))).candidates,
    ).toEqual([])
    expect((await detect(createProjectFiles(project({})))).candidates).toEqual([])
  })

  it('refuses a project already aimed at the native runtime', async () => {
    const native = project({
      dependencies: { '@builder.io/qwik': '^1.20.0', 'react-native': '0.86.0' },
    })
    const symbiote = project({
      dependencies: { '@builder.io/qwik': '^1.20.0', '@symbiote-native/vue': '2.0.0' },
    })

    expect((await detect(createProjectFiles(native))).candidates).toEqual([])
    expect((await detect(createProjectFiles(symbiote))).candidates).toEqual([])
  })
})

describe('a component is a resumable boundary, and its state stays metadata', () => {
  it('reads only the modules that declare a component$ boundary', () => {
    expect(readDeclaration('export default component$(() => <div />)').component).toBe(true)
    expect(readDeclaration('export const Counter = component$(() => <button />)').component).toBe(
      true,
    )
    expect(readDeclaration('export function helper() { return 1 }').component).toBe(false)
  })

  it('records the store and the signal a component uses without making them units', async () => {
    const report = await inspect(app)
    const counter = report.units.find((unit) => unit.source.file === 'src/components/Counter.tsx')
    const list = report.units.find((unit) => unit.source.file === 'src/components/List.tsx')

    expect(counter?.kind).toBe('component')
    expect(counter?.metadata).toEqual({ declaresStore: false, usesSignal: true })
    expect(list?.metadata).toEqual({ declaresStore: true, usesSignal: false })
    expect(report.units.some((unit) => unit.kind === 'state-module')).toBe(false)
  })
})

describe('the route table Qwik City documents', () => {
  it('reads the page files into the paths their directories name', () => {
    const { routes } = readRoutes(app.files, app.readText)

    expect(routes.map((route) => route.key).sort()).toEqual([
      '/',
      '/about',
      '/dashboard',
      '/docs/:slug',
      '/posts/:id',
      '/pricing',
      '/profile',
    ])
  })

  it('carries the parameters a dynamic segment declares', () => {
    const { routes } = readRoutes(app.files, app.readText)

    expect(routes.find((route) => route.key === '/posts/:id')?.params).toEqual(['id'])
    expect(routes.find((route) => route.key === '/docs/:slug')?.params).toEqual(['slug'])
  })

  it('omits a pathless group from the path', () => {
    expect(urlPattern(['(marketing)', 'pricing'])).toEqual({ pattern: '/pricing', params: [] })
  })

  it('keeps a named layout suffix out of the path', () => {
    const { routes } = readRoutes(app.files, app.readText)

    expect(routes.some((route) => route.key === '/dashboard')).toBe(true)
    expect(routes.some((route) => route.key.includes('@'))).toBe(false)
  })

  it('treats a markdown page as a route and keeps only one route per path', () => {
    const { routes } = readRoutes(app.files, app.readText)

    expect(routes.filter((route) => route.key === '/about')).toHaveLength(1)
    expect(routes.some((route) => route.key === '/dashboard')).toBe(true)
  })

  it('knows which files are route files', () => {
    expect(isRoutesFile('src/routes/index.tsx')).toBe(true)
    expect(isRoutesFile('src/components/Counter.tsx')).toBe(false)
  })
})

describe('layouts are units, because layout.tsx is a contract', () => {
  it('reads each layout file as a unit of its own kind', async () => {
    const report = await inspect(app)
    const layouts = report.units.filter((unit) => unit.kind === 'layout')

    expect(layouts).toHaveLength(2)
    expect(
      layouts.some(
        (unit) => unit.key === 'default' && unit.source.file === 'src/routes/layout.tsx',
      ),
    ).toBe(true)
    expect(
      layouts.some(
        (unit) =>
          unit.key === 'narrow' && unit.source.file === 'src/routes/dashboard/layout-narrow.tsx',
      ),
    ).toBe(true)
  })
})

describe('the surface Qwik City documents but this adapter does not model', () => {
  it('reports an endpoint, a 404 page, a plugin and a route rewrite as findings', async () => {
    const report = await inspect(app)
    const codes = report.findings.map((finding) => finding.code)

    expect(codes).toContain('qwik-endpoint')
    expect(codes).toContain('qwik-not-found-page')
    expect(codes).toContain('qwik-plugin')
    expect(codes).toContain('qwik-route-rewrite')
  })

  it('never turns a file of that surface into a unit or a route', async () => {
    const report = await inspect(app)
    const files = ['src/routes/rows/index.ts', 'src/routes/404.tsx', 'src/routes/plugin.ts']

    expect(report.routes.some((route) => files.includes(route.source.file))).toBe(false)
    expect(report.units.some((unit) => files.includes(unit.source.file))).toBe(false)
  })
})

describe('the Qwik reading as a graph', () => {
  it('reads the same thing twice', async () => {
    const first = await buildGraph(await inspect(app))
    const second = await buildGraph(await inspect(app))

    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })

  it('names this adapter on every node it produced', async () => {
    const graph = await buildGraph(await inspect(app))
    const ids = [
      ...graph.units.map((node) => node.id),
      ...graph.routes.map((node) => node.id),
      ...graph.capabilities.map((node) => node.id),
      ...graph.dependencies.map((node) => node.id),
    ]

    expect(ids.every((id) => id.startsWith(`${ADAPTER_ID}:`))).toBe(true)
    expect(graph.routes).toHaveLength(7)
  })

  it('says so when the Qwik major was not tested', async () => {
    const report = await inspect(bad)

    expect(report.findings.some((finding) => finding.code === 'version-untested')).toBe(true)
  })
})

describe('the Qwik adapter against the adapter contract', () => {
  it('satisfies the contract on both fixtures', async () => {
    expect(await verifyAdapterContract(adapter, app)).toEqual([])
    expect(await verifyAdapterContract(adapter, bad)).toEqual([])
  })
})
