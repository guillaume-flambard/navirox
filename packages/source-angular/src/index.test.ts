import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProjectFiles, verifyAdapterContract } from '@navirox/source'
import { describe, expect, it } from 'vitest'
import { buildGraph, createAngularAdapter, detect, readDeclaration, routePattern } from './index'

function fixture(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))
}

function project(manifest: string): string {
  const directory = mkdtempSync(join(tmpdir(), 'navirox-angular-'))
  writeFileSync(join(directory, 'package.json'), manifest)
  return directory
}

const adapter = createAngularAdapter()

describe('detecting Angular', () => {
  it('matches with manifest evidence', async () => {
    const result = await detect(createProjectFiles(fixture('angular-app')))

    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0]?.evidence[0]?.value).toContain('dependencies.@angular/core')
  })

  it('yields no candidate without Angular, and does not throw', async () => {
    expect(
      (
        await detect(
          createProjectFiles(project(JSON.stringify({ dependencies: { vue: '^3.5.0' } }))),
        )
      ).candidates,
    ).toEqual([])
    expect(
      (await detect(createProjectFiles(mkdtempSync(join(tmpdir(), 'navirox-ang-'))))).candidates,
    ).toEqual([])
  })
})

describe('reading declarations', () => {
  it('reads the decorator rather than the file name', () => {
    expect(readDeclaration("@Component({ selector: 'a' }) export class A {}").component).toBe(true)
    expect(readDeclaration('export class NotAComponent {}').component).toBe(false)

    // A decorator inside a comment is not a decorator.
    expect(readDeclaration('// @Component({})\nexport class A {}').component).toBe(false)
  })

  it('tells a stateful service from a stateless one', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('angular-app')))
    const kinds = new Map(inspection.units.map((unit) => [unit.source.file, unit.kind]))

    expect(kinds.get('src/app/services/counter.service.ts')).toBe('state-module')
    expect(kinds.get('src/app/services/rows.service.ts')).toBe('utility')
    expect(kinds.get('src/app/format.pipe.ts')).toBeUndefined()
  })

  it('reports components, services and pipes', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('angular-app')))
    const components = inspection.units.filter((unit) => unit.kind === 'component')

    expect(components).toHaveLength(5)
    expect(components.every((unit) => unit.source.file.endsWith('.component.ts'))).toBe(true)
  })

  it('does not report an entry point', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('angular-app')))

    expect(inspection.units.some((unit) => unit.source.file === 'src/main.ts')).toBe(false)
  })
})

describe('reading routes', () => {
  it('turns a stated path into a URL', () => {
    expect(routePattern('')).toEqual({ pattern: '/', params: [] })
    expect(routePattern('about')).toEqual({ pattern: '/about', params: [] })
    expect(routePattern('blog/:slug')).toEqual({ pattern: '/blog/:slug', params: ['slug'] })
  })

  it('reads the top level routes a file states', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('angular-app')))

    expect(inspection.routes.map((route) => route.pathPattern)).toEqual([
      '/',
      '/about',
      '/blog/:slug',
    ])
  })

  it('reports children and lazy loading without producing routes for them', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('angular-bad')))
    const codes = inspection.findings.map((finding) => finding.code)

    // `admin` is a path the file states, and it is reported; what is not resolved
    // is the child underneath it.
    expect(inspection.routes.map((route) => route.pathPattern)).toEqual(['/', '/admin'])
    expect(codes).toContain('angular-route-children')
    expect(codes).toContain('angular-lazy-route')
  })
})

describe('what the adapter refuses to model', () => {
  it('reports a module declaration and an external template', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('angular-bad')))
    const codes = inspection.findings.map((finding) => finding.code)

    expect(codes).toContain('angular-module')
    expect(codes).toContain('angular-external-template')
    expect(codes).toContain('version-untested')
  })

  it('still reports the component that points at an external template', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('angular-bad')))

    expect(
      inspection.units.some((unit) => unit.source.file === 'src/app/widget.component.ts'),
    ).toBe(true)
  })
})

describe('the vocabulary the other adapters use', () => {
  it('reads the same capabilities from the mirrored fixture', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('angular-app')))

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

  it('produces a deterministic fragment whose identifiers name the adapter', async () => {
    const first = await adapter.inspect(createProjectFiles(fixture('angular-app')))
    const second = await adapter.inspect(createProjectFiles(fixture('angular-app')))
    const graph = await buildGraph(first)
    const ids = [
      ...graph.units.map((node) => node.id),
      ...graph.routes.map((node) => node.id),
      ...graph.capabilities.map((node) => node.id),
    ]

    expect(JSON.stringify(await buildGraph(second))).toBe(JSON.stringify(graph))
    expect(ids.every((id) => id.startsWith('angular:'))).toBe(true)
    expect(graph.units.map((unit) => unit.kind).sort()).toEqual([
      'component',
      'component',
      'component',
      'component',
      'component',
      'state-module',
      'utility',
      'utility',
      'utility',
    ])
  })
})

describe('the Angular adapter against the adapter contract', () => {
  it('reports no violation', async () => {
    expect(
      await verifyAdapterContract(adapter, createProjectFiles(fixture('angular-app'))),
    ).toEqual([])
  })
})
