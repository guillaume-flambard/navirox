import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProjectFiles, verifyAdapterContract } from '@memolabs-apps/source'
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
      '/profile',
    ])
  })

  it('reads literal child routes and reports lazy loading without guessing it', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('angular-bad')))
    const codes = inspection.findings.map((finding) => finding.code)

    expect(inspection.routes.map((route) => route.pathPattern)).toEqual([
      '/',
      '/admin',
      '/admin/users',
      '/reports',
    ])
    expect(codes).not.toContain('angular-route-children')
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
    expect(graph.screens).toHaveLength(2)
    expect(graph.screens[0]?.unitId).toBe('angular:src/app/app.component.ts:component:default')
    expect(graph.screens[0]?.routeIds).toHaveLength(1)
    expect(graph.screens[1]?.unitId).toBe(
      'angular:src/app/views/profile.component.ts:component:default',
    )
    expect(graph.screens[1]?.routeIds).toHaveLength(1)
  })
})

describe('the Angular adapter against the adapter contract', () => {
  it('reports no violation', async () => {
    expect(
      await verifyAdapterContract(adapter, createProjectFiles(fixture('angular-app'))),
    ).toEqual([])
  })
})

describe('the SuiteCRM shape', () => {
  it('reads a routing module as a route table without losing its module finding', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('suitecrm-app')))

    expect(inspection.routes.map((route) => route.pathPattern)).toEqual([
      '/',
      '/admin/configuration',
      '/portal/cases',
      '/records/:id',
      '/records/:id/attachments',
      '/records/:id/edit',
      '/records/:id/history',
    ])
    expect(
      inspection.findings
        .filter((entry) => entry.code === 'angular-module')
        .map((entry) => entry.source?.file),
    ).toEqual(['src/app/app-routing.module.ts', 'src/app/app.module.ts'])
  })

  it('reports the surfaces it cannot read instead of guessing them', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('suitecrm-app')))
    const codes = (file: string): string[] =>
      inspection.findings.filter((entry) => entry.source?.file === file).map((entry) => entry.code)

    expect(codes('extensions/portal/src/app/portal-extension.service.ts')).toContain(
      'angular-remote-configuration',
    )
    expect(codes('extensions/portal/src/app/dynamic.routes.ts')).toEqual([
      'angular-route-path-not-literal',
    ])
    expect(codes('src/records/record-history.component.ts')).toContain('angular-external-template')
    expect(inspection.routes.every((route) => !route.pathPattern.includes('${'))).toBe(true)
  })

  it('loads the fixture without an Angular runtime', async () => {
    expect(existsSync(join(fixture('suitecrm-app'), 'node_modules'))).toBe(false)
    expect(existsSync(join(fixture('suitecrm-app'), 'package.json'))).toBe(true)
  })

  it('classifies mobile readiness with a source location and a reason', async () => {
    const inspection = await adapter.inspect(createProjectFiles(fixture('suitecrm-app')))
    const readinessOf = (file: string): Record<string, unknown> | undefined => {
      const unit = inspection.units.find((entry) => entry.source.file === file)

      return unit?.metadata?.mobileReadiness as Record<string, unknown> | undefined
    }
    const states = inspection.units.map(
      (unit) => (unit.metadata?.mobileReadiness as Record<string, unknown> | undefined)?.state,
    )

    expect(new Set(states)).toEqual(new Set(['candidate', 'desktop-only', 'unknown']))

    expect(readinessOf('src/records/record-attachments.component.ts')).toMatchObject({
      state: 'candidate',
      rule: 'attachment-signal',
    })
    expect(readinessOf('src/records/record-detail.component.ts')).toMatchObject({
      state: 'candidate',
      rule: 'device-capability-signal',
    })
    expect(readinessOf('src/records/record-update-form.component.ts')).toMatchObject({
      state: 'candidate',
      rule: 'record-update-signal',
    })
    expect(readinessOf('src/configuration/configuration.component.ts')).toMatchObject({
      state: 'desktop-only',
      rule: 'administration-surface',
    })
    expect(readinessOf('src/records/record-history.component.ts')).toMatchObject({
      state: 'unknown',
      rule: 'unread-template',
    })
    expect(readinessOf('src/records/record-list.component.ts')).toMatchObject({
      state: 'unknown',
      rule: 'no-mobile-signal',
    })

    for (const unit of inspection.units) {
      const readiness = readinessOf(unit.source.file)

      expect(unit.source.file).toEqual(expect.any(String))
      expect(readiness?.reason).toEqual(expect.any(String))
      expect(readiness?.evidence).toContain(unit.source.file)
    }

    expect(JSON.stringify(inspection.units)).not.toContain('portable')
  })
})
