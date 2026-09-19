import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProjectFiles, verifyAdapterContract } from '@memolabs-apps/source'
import { describe, expect, it } from 'vitest'
import {
  ADAPTER_ID,
  buildGraph,
  createAstroAdapter,
  detect,
  inspect,
  isExcluded,
  isServerSurface,
  pageSegments,
  readIntegrations,
  readIslands,
  readRoutes,
  urlPattern,
} from './index'

function fixture(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))
}

function project(manifest: Record<string, unknown>): string {
  const directory = mkdtempSync(join(tmpdir(), 'navirox-astro-'))
  writeFileSync(join(directory, 'package.json'), JSON.stringify(manifest))
  return directory
}

const adapter = createAstroAdapter()
const app = createProjectFiles(fixture('astro-app'))
const bad = createProjectFiles(fixture('astro-bad'))

describe('detecting Astro, and refusing the target', () => {
  it('matches an Astro project with manifest evidence', async () => {
    const result = await detect(app)

    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0]?.evidence[0]?.value).toContain('dependencies.astro')
  })

  it('declares the island adapters it composes', () => {
    expect(adapter.composes).toEqual(['vue', 'react', 'svelte'])
    expect(adapter.testedVersions).toEqual([{ framework: 'astro', versions: ['^7.0.0'] }])
  })

  it('yields no candidate without Astro, and does not throw', async () => {
    expect(
      (await detect(createProjectFiles(project({ dependencies: { vue: '^3.5.43' } })))).candidates,
    ).toEqual([])
    expect(
      (await detect(createProjectFiles(mkdtempSync(join(tmpdir(), 'navirox-a-'))))).candidates,
    ).toEqual([])
  })

  it('refuses a project that declares the native runtime', async () => {
    const result = await detect(
      createProjectFiles(project({ dependencies: { astro: '^7.0.0', 'react-native': '^0.86.0' } })),
    )

    expect(result.candidates).toEqual([])
  })

  it('refuses a project that declares a native module', async () => {
    const result = await detect(
      createProjectFiles(
        project({ dependencies: { astro: '^7.0.0', '@symbiote-native/vue': '2.0.0' } }),
      ),
    )

    expect(result.candidates).toEqual([])
  })
})

describe('pages and routes', () => {
  it('reads the file layout of src/pages', () => {
    const { routes } = readRoutes(app.files)
    const patterns = routes.map((route) => route.pathPattern)

    expect([...patterns].sort()).toEqual(
      ['/', '/:lang-:version/info', '/about', '/blog/:slug', '/posts/1', '/sequences/:path'].sort(),
    )
  })

  it('reads the parameters of a dynamic segment', () => {
    const { routes } = readRoutes(app.files)
    const params = (pattern: string): readonly string[] | undefined =>
      routes.find((route) => route.pathPattern === pattern)?.params

    expect(params('/blog/:slug')).toEqual(['slug'])
    expect(params('/sequences/:path')).toEqual(['path'])
    expect(params('/:lang-:version/info')).toEqual(['lang', 'version'])
  })

  it('excludes a file whose name is prefixed with an underscore', () => {
    const { routes } = readRoutes(app.files)

    expect(routes.some((route) => route.source.file.includes('_private'))).toBe(false)
    expect(isExcluded(['src', 'pages', '_private.astro'])).toBe(true)
  })

  it('reports an endpoint instead of a route', () => {
    const { routes, findings } = readRoutes(app.files)

    expect(routes.some((route) => route.source.file === 'src/pages/api/rows.ts')).toBe(false)
    expect(findings.map((finding) => finding.code)).toContain('astro-endpoint')
  })

  it('reads the path of a page', () => {
    expect(pageSegments('src/pages/blog/[slug].astro')).toEqual(['blog', '[slug].astro'])
    expect(pageSegments('src/App.astro')).toBeUndefined()
    expect(urlPattern(['[lang]-[version]', 'info']).pattern).toBe('/:lang-:version/info')
  })
})

describe('the server surface', () => {
  it('reads an endpoint as a file outside the browser runtime', async () => {
    const report = await inspect(app)

    expect(report.units.some((unit) => unit.source.file === 'src/pages/api/rows.ts')).toBe(false)
    expect(report.routes.some((route) => route.source.file === 'src/pages/api/rows.ts')).toBe(false)
  })

  it('recognizes the files that do not run in the application', () => {
    expect(isServerSurface('src/pages/api/rows.ts')).toBe(true)
    expect(isServerSurface('src/middleware.ts')).toBe(true)
    expect(isServerSurface('astro.config.mjs')).toBe(true)
    expect(isServerSurface('src/pages/index.astro')).toBe(false)
  })
})

describe('islands', () => {
  it('records each island on the file that carries it', async () => {
    const report = await inspect(app)
    const page = report.units.find((unit) => unit.source.file === 'src/pages/index.astro')
    const islands = page?.metadata?.islands as readonly { component: string; file?: string }[]

    expect(islands.map((island) => island.component).sort()).toEqual(['App', 'Counter'])
    expect(islands.map((island) => island.file).sort()).toEqual([
      'src/components/App.vue',
      'src/components/Counter.tsx',
    ])
  })

  it('attributes the components an island adapter reads to this adapter', async () => {
    const report = await inspect(app)
    const read = report.units.filter((unit) => unit.source.file === 'src/components/App.vue')

    expect(read).toHaveLength(1)
    expect(read[0]?.source.adapterId).toBe(ADAPTER_ID)

    const graph = await buildGraph(report)
    const unit = graph.units.find((entry) => entry.source.file === 'src/components/App.vue')

    expect(unit?.id.startsWith('astro:')).toBe(true)
  })

  it('reports a directive it cannot resolve, and one it must not hydrate', () => {
    const files = ['src/components/App.vue', 'src/components/Local.astro', 'src/pages/index.astro']
    const text = [
      '---',
      "import App from '../components/App.vue'",
      "import Local from '../components/Local.astro'",
      '---',
      '<App client:load />',
      '<Local client:visible />',
      '<Missing client:idle />',
    ].join('\n')

    const result = readIslands('src/pages/index.astro', text, files)

    expect(result.islands).toEqual([
      {
        component: 'App',
        directive: 'client:load',
        framework: 'vue',
        file: 'src/components/App.vue',
      },
    ])
    expect(result.findings.map((finding) => finding.code).sort()).toEqual([
      'astro-island-not-hydratable',
      'astro-island-unresolved',
    ])
  })

  it('names an integration it cannot read, and the ambiguity Astro asks about', () => {
    expect(readIntegrations(['@astrojs/preact']).map((finding) => finding.code)).toEqual([
      'astro-unread-integration',
    ])
    expect(
      readIntegrations(['@astrojs/react', '@astrojs/solid-js']).map((finding) => finding.code),
    ).toContain('astro-ambiguous-jsx')
    expect(readIntegrations(['@astrojs/vue'])).toEqual([])
  })
})

describe('the fragment', () => {
  it('reads the manifest itself, and attributes every dependency to this adapter', async () => {
    const report = await inspect(app)
    const names = report.dependencies.map((dependency) => dependency.name)

    expect(names).toContain('astro')
    expect(names).toContain('@astrojs/vue')
    expect(
      report.dependencies.every((dependency) => dependency.source?.adapterId === ADAPTER_ID),
    ).toBe(true)
  })

  it('reads the same capabilities as the Vue fixture', async () => {
    const report = await inspect(app)

    expect(report.capabilities.map((node) => `${node.capability}:${node.usage}`).sort()).toEqual([
      'geolocation:invoke',
      'local-storage:read',
      'local-storage:unknown',
      'local-storage:write',
      'network-request:invoke',
    ])
  })

  it('reads an astro file outside src/pages as a component, not a layout', async () => {
    const report = await inspect(app)
    const kinds = [...new Set(report.units.map((unit) => unit.kind))].sort()

    expect(kinds).toEqual(['component', 'utility'])
    expect(report.units.some((unit) => unit.source.file === 'src/layouts/Base.astro')).toBe(true)
  })

  it('attributes every node of the graph to this adapter, and stays deterministic', async () => {
    const first = await inspect(app)
    const second = await inspect(app)
    const fragment = await buildGraph(first)
    const ids = [
      ...fragment.units,
      ...fragment.routes,
      ...fragment.capabilities,
      ...fragment.dependencies,
    ].map((node) => node.id)

    expect(ids.every((id) => id.startsWith('astro:'))).toBe(true)
    expect(second).toEqual(first)
  })

  it('reports an untested Astro major', async () => {
    const report = await inspect(bad)

    expect(report.findings.map((finding) => finding.code)).toContain('version-untested')
  })

  it('passes the adapter contract on both fixtures', async () => {
    expect(await verifyAdapterContract(adapter, app)).toEqual([])
    expect(await verifyAdapterContract(adapter, bad)).toEqual([])
  })
})
