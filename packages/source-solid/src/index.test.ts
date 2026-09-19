import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProjectFiles, verifyAdapterContract } from '@memolabs-apps/source'
import type { SourceInspection } from '@memolabs-apps/source'
import { describe, expect, it } from 'vitest'
import {
  ADAPTER_ID,
  buildGraph,
  createSolidAdapter,
  hasWildcardSegment,
  readDeclaration,
  readRoutes,
  routePattern,
} from './index'

function fixture(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))
}

function project(manifest: Record<string, unknown>): string {
  const directory = mkdtempSync(join(tmpdir(), 'navirox-solid-'))
  writeFileSync(join(directory, 'package.json'), JSON.stringify(manifest))
  return directory
}

const adapter = createSolidAdapter()
const app = createProjectFiles(fixture('solid-app'))
const bad = createProjectFiles(fixture('solid-bad'))

function capabilities(report: SourceInspection): string[] {
  return report.capabilities.map((entry) => `${entry.capability}:${entry.usage}`).sort()
}

describe('detecting Solid', () => {
  it('claims a project that declares solid-js', async () => {
    const result = await adapter.detect(app)

    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0]?.confidence).toBe('high')
    expect(result.candidates[0]?.evidence[0]?.value).toContain('dependencies.solid-js')
  })

  it('is a base adapter, so it composes nothing', async () => {
    expect(adapter.composes).toBeUndefined()
    expect(adapter.testedVersions).toEqual([{ framework: 'solid-js', versions: ['^1.9.0'] }])
  })

  it('does not claim a project without solid-js', async () => {
    const nothing = await adapter.detect(
      createProjectFiles(project({ dependencies: { vue: '^3.5.0' } })),
    )

    expect(nothing.candidates).toEqual([])
  })

  it('refuses a project that already declares the native runtime', async () => {
    for (const name of ['react-native', '@symbiote-native/vue']) {
      const native = await adapter.detect(
        createProjectFiles(project({ dependencies: { 'solid-js': '^1.9.0', [name]: '^1.0.0' } })),
      )

      expect(native.candidates).toEqual([])
    }
  })
})

describe('reading a component and a store', () => {
  it('finds a component by what the module exports', () => {
    expect(readDeclaration('export function App() {\n  return <main />\n}\n').component).toBe(true)
    expect(readDeclaration('export const Card = () => <view />').component).toBe(true)
  })

  it('does not read a helper as a component', () => {
    expect(
      readDeclaration('export function double(value: number) {\n  return value * 2\n}\n').component,
    ).toBe(false)
  })

  it('reads a store as one when it declares it', () => {
    expect(
      readDeclaration(
        "import { createStore } from 'solid-js/store'\nexport const [state] = createStore({})\n",
      ).declaresStore,
    ).toBe(true)
    expect(
      readDeclaration(
        "import { createMutable } from 'solid-js/store'\nexport const state = createMutable({})\n",
      ).declaresStore,
    ).toBe(true)
  })
})

describe('reading the routes', () => {
  it('reads the object shape of the router', async () => {
    const report = await adapter.inspect(app)

    expect(report.routes.map((route) => route.pathPattern)).toEqual(['/', '/profile', '/rows/:id'])
  })

  it('reads the JSX shape of the router', () => {
    const reading = readRoutes(
      'src/routes.tsx',
      'export const routes = () => (\n  <Route path="/about" component={About} />\n)\n',
    )

    expect(reading.routes.map((route) => route.pathPattern)).toEqual(['/about'])
  })

  it('turns a parameter segment into a parameter', () => {
    const reading = readRoutes('src/routes.tsx', "{ path: '/rows/:id', component: Rows }")

    expect(reading.routes[0]?.params).toEqual(['id'])
  })

  it('keeps a path without a leading slash and drops a wildcard segment', () => {
    expect(routePattern('about')).toBe('/about')
    expect(routePattern('/rows/*rest')).toBe('/rows')
    expect(routePattern('*404')).toBe('/')
    expect(hasWildcardSegment('/rows/*rest')).toBe(true)
  })

  it('reports a path it cannot read instead of guessing it', () => {
    const reading = readRoutes('src/routes.tsx', '{ path: routePath, component: Rows }')

    expect(reading.routes).toEqual([])
    expect(reading.findings.map((finding) => finding.code)).toEqual([
      'solid-route-path-not-literal',
    ])
  })

  it('reports a nested route and a lazy import', () => {
    const nested = readRoutes(
      'src/routes.tsx',
      "{ path: '/app', children: [{ path: '/inner', component: Inner }] }",
    )
    const lazy = readRoutes('src/routes.tsx', "const Rows = lazy(() => import('./Rows'))")

    expect(nested.findings.map((finding) => finding.code)).toContain('solid-route-children')
    expect(lazy.findings.map((finding) => finding.code)).toContain('solid-lazy-route')
  })
})

describe('the fragment', () => {
  it('reads the same capabilities the Vue fixture journey uses', async () => {
    expect(capabilities(await adapter.inspect(app))).toEqual([
      'geolocation:invoke',
      'local-storage:read',
      'local-storage:unknown',
      'local-storage:write',
      'network-request:invoke',
    ])
  })

  it('reads the three kinds of unit the journey has', async () => {
    const report = await adapter.inspect(app)

    expect([...new Set(report.units.map((unit) => unit.kind))].sort()).toEqual([
      'component',
      'state-module',
      'utility',
    ])
    expect(report.units.find((unit) => unit.source.file === 'src/stores/counter.ts')?.kind).toBe(
      'state-module',
    )
  })

  it('attributes every identifier to this adapter and stays deterministic', async () => {
    const first = await buildGraph(await adapter.inspect(app))
    const second = await buildGraph(await adapter.inspect(app))
    const nodes = [...first.units, ...first.routes, ...first.capabilities, ...first.dependencies]

    expect(nodes.every((node) => node.id.startsWith(`${ADAPTER_ID}:`))).toBe(true)
    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })

  it('reports a version it has not been exercised against', async () => {
    const report = await adapter.inspect(bad)

    expect(report.findings.map((finding) => finding.code)).toEqual(['version-untested'])
  })

  it('satisfies the adapter contract on both fixtures', async () => {
    expect(await verifyAdapterContract(adapter, app)).toEqual([])
    expect(await verifyAdapterContract(adapter, bad)).toEqual([])
  })
})
