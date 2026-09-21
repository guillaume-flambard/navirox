import { fileURLToPath } from 'node:url'
import { createProjectFiles } from '@memolabs-apps/source'
import { describe, expect, it } from 'vitest'
import { buildGraph, inspect } from './index'

function fixture(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))
}

async function fragment(): Promise<Awaited<ReturnType<typeof buildGraph>>> {
  const inspection = await inspect(createProjectFiles(fixture('vue-app')))
  return buildGraph(inspection, { rootDir: fixture('vue-app') })
}

describe('building the fragment', () => {
  it('is identical for two inspections of an unchanged project', async () => {
    const first = await fragment()
    const second = await fragment()

    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })

  it('names the adapter in every identifier', async () => {
    const graph = await fragment()
    const ids = [
      ...graph.units.map((node) => node.id),
      ...graph.capabilities.map((node) => node.id),
      ...graph.dependencies.map((node) => node.id),
    ]

    expect(ids.length).toBeGreaterThan(0)
    expect(ids.every((id) => id.startsWith('vue:'))).toBe(true)
  })

  it('carries a source location on every node', async () => {
    const graph = await fragment()

    for (const node of [...graph.units, ...graph.capabilities]) {
      expect(node.source.file).toBeTruthy()
      expect(node.source.adapterId).toBe('vue')
    }
  })

  it('links a unit to the capabilities it uses', async () => {
    const graph = await fragment()
    const app = graph.units.find((unit) => unit.source.file === 'src/App.vue')
    const capabilityIds = graph.capabilities
      .filter((capability) => capability.source.file === 'src/App.vue')
      .map((capability) => capability.id)

    expect(app?.dependencies.sort()).toEqual(capabilityIds.sort())
    expect(
      graph.edges.filter((edge) => edge.from === app?.id).every((edge) => edge.kind === 'uses'),
    ).toBe(true)
  })

  it('reports dependencies as nodes with their range', async () => {
    const graph = await fragment()
    const vue = graph.dependencies.find((node) => node.name === 'vue')

    expect(vue?.version).toBe('^3.5.43')
    expect(vue?.id).toBe('vue:package.json:dependency:vue')
  })

  it('links routes that name a component to one screen', async () => {
    const graph = await fragment()

    expect(
      graph.routes.map((route) => ({ path: route.pathPattern, params: route.params })),
    ).toEqual([
      { path: '/', params: undefined },
      { path: '/profile/:id', params: ['id'] },
    ])
    expect(graph.screens).toHaveLength(1)
    expect(graph.screens[0]?.unitId).toBe('vue:src/views/Profile.vue:component:default')
    expect(graph.screens[0]?.routeIds).toHaveLength(2)
    expect(new Set(graph.routes.map((route) => route.screenId))).toEqual(
      new Set([graph.screens[0]?.id]),
    )
    expect(graph.actions).toEqual([])
    expect(graph.data).toEqual([])
  })

  it('carries the inspection findings through', async () => {
    const inspection = await inspect(createProjectFiles(fixture('vue-app')))
    const graph = await buildGraph(inspection, { rootDir: fixture('vue-app') })

    expect(graph.findings).toEqual(inspection.findings)
  })
})
