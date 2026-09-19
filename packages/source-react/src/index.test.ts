import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProjectFiles, verifyAdapterContract } from '@memolabs-apps/source'
import { describe, expect, it } from 'vitest'
import {
  buildGraph,
  createReactAdapter,
  detect,
  nativeDeclarations,
  readDeclaration,
  routePattern,
} from './index'

function fixture(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))
}

function project(manifest: Record<string, unknown>): string {
  const directory = mkdtempSync(join(tmpdir(), 'navirox-react-'))
  writeFileSync(join(directory, 'package.json'), JSON.stringify(manifest))
  return directory
}

const adapter = createReactAdapter()

describe('detecting React, and refusing the target', () => {
  it('matches a web project with manifest evidence', async () => {
    const result = await detect(createProjectFiles(fixture('react-app')))

    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0]?.evidence[0]?.value).toContain('dependencies.react')
  })

  it('refuses a project that declares the native runtime', async () => {
    const root = project({ dependencies: { react: '^19.0.0', 'react-native': '^0.76.0' } })
    const result = await detect(createProjectFiles(root))

    expect(result.candidates).toEqual([])
  })

  it('refuses a project that declares a native module', async () => {
    expect(
      nativeDeclarations({
        dependencies: { react: '^19.0.0', 'react-native-keychain': '^10.0.0' },
      }),
    ).toEqual(['react-native-keychain'])
  })

  it('yields no candidate without React, and does not throw', async () => {
    expect(
      (await detect(createProjectFiles(project({ dependencies: { vue: '^3.5.0' } })))).candidates,
    ).toEqual([])
    expect(
      (await detect(createProjectFiles(mkdtempSync(join(tmpdir(), 'navirox-r-'))))).candidates,
    ).toEqual([])
  })
})

describe('reading what a module exports', () => {
  it('finds a component by what it exports, not by its name', () => {
    expect(readDeclaration('export function A() {\n  return <p />\n}').component).toBe(true)
    expect(readDeclaration('export const A = () => <p />').component).toBe(true)

    const notAComponent = readDeclaration("export const NotAComponent = 'a string'")

    expect(notAComponent.component).toBe(false)
    expect(notAComponent.classComponent).toBe(false)
  })

  it('recognizes a class component, which it reports rather than models', () => {
    expect(readDeclaration('export class A extends Component {}').classComponent).toBe(true)
  })
})

describe('inspecting a React project', () => {
  it('reports every component once, and an entry point not at all', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('react-app')))
    const components = inspection.units.filter((unit) => unit.kind === 'component')

    expect(components).toHaveLength(5)
    expect(inspection.units.some((unit) => unit.source.file === 'src/main.tsx')).toBe(false)
  })

  it('reports a declared store as a state module and an import alone as a utility', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('react-app')))
    const kinds = new Map(inspection.units.map((unit) => [unit.source.file, unit.kind]))

    expect(kinds.get('src/stores/counter.ts')).toBe('state-module')
    expect(kinds.get('src/lib/api.ts')).toBe('utility')
    expect(kinds.get('src/lib/storage.ts')).toBe('utility')
  })

  it('reads the same capabilities the other adapters read', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('react-app')))

    expect(
      inspection.capabilities
        .map((capability) => `${capability.capability}:${capability.usage}`)
        .sort(),
    ).toEqual([
      'geolocation:invoke',
      'local-storage:read',
      'local-storage:unknown',
      'local-storage:write',
      'network-request:invoke',
    ])
  })

  it('reads the top level routes a configuration states', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('react-app')))

    expect(inspection.routes.map((route) => route.pathPattern)).toEqual([
      '/',
      '/about',
      '/blog/:slug',
    ])
    expect(routePattern('blog/:slug')).toEqual({ pattern: '/blog/:slug', params: ['slug'] })
  })
})

describe('what the adapter refuses, and what it warns about', () => {
  it('reports a class component, nested routes and lazy loading', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('react-bad')))
    const codes = inspection.findings.map((finding) => finding.code)

    expect(codes).toContain('react-class-component')
    expect(codes).toContain('react-route-children')
    expect(codes).toContain('react-lazy-route')
    expect(codes).toContain('version-untested')
  })

  it('names a native dependency when the adapter is chosen by name', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('react-bad')))
    const native = inspection.findings.find((finding) => finding.code === 'react-native-dependency')

    expect(native?.severity).toBe('warning')
    expect(native?.message).toContain('react-native')
  })

  it('still reports the class component as a unit', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('react-bad')))

    expect(
      inspection.units.some(
        (unit) => unit.source.file === 'src/Legacy.tsx' && unit.kind === 'component',
      ),
    ).toBe(true)
    expect(inspection.units.some((unit) => unit.source.file === 'src/NotAComponent.tsx')).toBe(true)
  })
})

describe('the shared vocabulary', () => {
  it('produces a deterministic fragment whose identifiers name the adapter', async () => {
    const first = await adapter.inspect(createProjectFiles(fixture('react-app')))
    const second = await adapter.inspect(createProjectFiles(fixture('react-app')))
    const graph = await buildGraph(first)
    const ids = [
      ...graph.units.map((node) => node.id),
      ...graph.routes.map((node) => node.id),
      ...graph.capabilities.map((node) => node.id),
    ]

    expect(JSON.stringify(await buildGraph(second))).toBe(JSON.stringify(graph))
    expect(ids.every((id) => id.startsWith('react:'))).toBe(true)
  })

  it('reports no contract violation', async () => {
    expect(await verifyAdapterContract(adapter, createProjectFiles(fixture('react-app')))).toEqual(
      [],
    )
  })
})
