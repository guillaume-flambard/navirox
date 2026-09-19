import { fileURLToPath } from 'node:url'
import { createProjectFiles, verifyAdapterContract } from '@memolabs-apps/source'
import { describe, expect, it } from 'vitest'
import { buildGraph, createSvelteAdapter, inspect } from './index'

function fixture(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))
}

function codes(findings: readonly { readonly code: string }[]): string[] {
  return findings.map((finding) => finding.code).sort()
}

function uses(inspection: Awaited<ReturnType<typeof inspect>>): string[] {
  return inspection.capabilities
    .map((capability) => `${capability.capability}:${capability.usage}`)
    .sort()
}

describe('inspecting a Svelte project', () => {
  it('reports every component exactly once', async () => {
    const inspection = await inspect(createProjectFiles(fixture('svelte-app')))
    const files = inspection.units
      .filter((unit) => unit.kind === 'component')
      .map((unit) => unit.source.file)
      .sort()

    expect(files).toEqual([
      'src/App.svelte',
      'src/components/Counter.svelte',
      'src/components/List.svelte',
      'src/components/NameInput.svelte',
      'src/views/Profile.svelte',
    ])
    expect(new Set(files).size).toBe(files.length)
  })

  it('keeps framework detail in adapter owned metadata', async () => {
    const inspection = await inspect(createProjectFiles(fixture('svelte-app')))
    const app = inspection.units.find((unit) => unit.source.file === 'src/App.svelte')

    expect(app?.metadata).toEqual({ script: true, style: true, moduleScript: false })
  })

  it('reports a store declaration and not a module that only imports the helpers', async () => {
    const inspection = await inspect(createProjectFiles(fixture('svelte-app')))
    const stateModules = inspection.units
      .filter((unit) => unit.kind === 'state-module')
      .map((unit) => unit.source.file)

    expect(stateModules).toEqual(['src/stores/counter.ts'])

    // The module that only imports the helpers is not a store, and it is
    // application logic, so it is reported as a utility unit rather than not at all.
    const helpers = inspection.units.find((unit) => unit.source.file === 'src/lib/stores.ts')

    expect(helpers?.kind).toBe('utility')
  })

  it('reports capability use through the shared scan, with file and usage kind', async () => {
    const inspection = await inspect(createProjectFiles(fixture('svelte-app')))

    expect(uses(inspection)).toEqual([
      'geolocation:invoke',
      'local-storage:read',
      'local-storage:unknown',
      'local-storage:write',
      'network-request:invoke',
    ])
  })

  it('lists production dependencies with their declared range and no verdict', async () => {
    const inspection = await inspect(createProjectFiles(fixture('svelte-app')))

    expect(inspection.dependencies.map((dependency) => dependency.name)).toEqual(['svelte'])
    expect(inspection.dependencies[0]?.version).toBe('^5.0.30')
  })

  it('claims no support for a version outside the tested range', async () => {
    const inspection = await inspect(createProjectFiles(fixture('svelte-app')))

    expect(codes(inspection.findings)).toEqual([])
    expect(inspection.descriptor.frameworkVersion).toBe('^5.0.30')
  })
})

describe('inspecting a project the adapter cannot stand behind', () => {
  it('reports the old major and the constructs it does not model', async () => {
    const inspection = await inspect(createProjectFiles(fixture('svelte-broken')))

    expect(codes(inspection.findings)).toEqual([
      'html-injection',
      'svelte4-syntax',
      'version-untested',
    ])
  })

  it('still reports the components it read', async () => {
    const inspection = await inspect(createProjectFiles(fixture('svelte-broken')))

    // Ordered by file, so api.ts sorts before the components.
    expect(inspection.units.map((unit) => unit.source.file)).toEqual([
      'src/Legacy.svelte',
      'src/lib/api.ts',
      'src/Raw.svelte',
    ])
  })

  it('produces no route, because routes are SvelteKit work', async () => {
    const inspection = await inspect(createProjectFiles(fixture('svelte-app')))

    expect(inspection.routes).toEqual([])
  })
})

describe('building the Svelte fragment', () => {
  it('is identical for two inspections and names the adapter in every id', async () => {
    const first = await inspect(createProjectFiles(fixture('svelte-app')))
    const second = await inspect(createProjectFiles(fixture('svelte-app')))

    expect(first.units).toEqual(second.units)

    const graph = await buildGraph(first)
    const ids = [
      ...graph.units.map((node) => node.id),
      ...graph.capabilities.map((node) => node.id),
      ...graph.dependencies.map((node) => node.id),
    ]

    expect(ids.length).toBeGreaterThan(0)
    expect(ids.every((id) => id.startsWith('svelte:'))).toBe(true)
  })

  it('links a unit to the capabilities it uses', async () => {
    const inspection = await inspect(createProjectFiles(fixture('svelte-app')))
    const graph = await buildGraph(inspection)
    const app = graph.units.find((unit) => unit.source.file === 'src/App.svelte')
    const inApp = graph.capabilities
      .filter((capability) => capability.source.file === 'src/App.svelte')
      .map((capability) => capability.id)

    expect(app?.dependencies.sort()).toEqual(inApp.sort())
  })
})

describe('the Svelte adapter against the adapter contract', () => {
  it('reports no violation', async () => {
    const root = fixture('svelte-app')
    const violations = await verifyAdapterContract(createSvelteAdapter(), createProjectFiles(root))

    expect(violations).toEqual([])
  })
})
