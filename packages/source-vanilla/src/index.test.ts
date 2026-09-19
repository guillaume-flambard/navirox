import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProjectFiles, verifyAdapterContract } from '@memolabs-apps/source'
import { describe, expect, it } from 'vitest'
import {
  ADAPTER_ID,
  buildGraph,
  createVanillaAdapter,
  detect,
  documentPattern,
  isDocument,
  readDocuments,
  resolveDocumentModule,
} from './index'

function fixture(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))
}

function project(manifest: Record<string, unknown>, files: Record<string, string>): string {
  const directory = mkdtempSync(join(tmpdir(), 'navirox-vanilla-'))
  writeFileSync(join(directory, 'package.json'), JSON.stringify(manifest))

  for (const [name, contents] of Object.entries(files)) {
    writeFileSync(join(directory, name), contents)
  }

  return directory
}

const adapter = createVanillaAdapter()
const app = createProjectFiles(fixture('vanilla-app'))
const bad = createProjectFiles(fixture('vanilla-bad'))

describe('detecting a project that declares nothing', () => {
  it('claims a project with a document and no framework', async () => {
    const result = await detect(app)

    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0]?.confidence).toBe('low')
    expect(result.candidates[0]?.evidence[0]?.value).toContain('declares no source framework')
    expect(result.candidates[0]?.evidence[1]?.kind).toBe('source')
    expect(result.candidates[0]?.evidence[1]?.value).toMatch(/\.html$/)
  })

  it('declares the platform rather than a version', () => {
    expect(adapter.testedVersions).toEqual([{ framework: 'html', versions: ['living standard'] }])
    expect(adapter.composes).toBeUndefined()
  })

  it('leaves a framework project to its framework', async () => {
    const directory = project({ dependencies: { vue: '^3.5.0' } }, { 'index.html': '<p>hi</p>' })
    const files = createProjectFiles(directory)
    const result = await detect({
      rootDir: directory,
      files: files.files,
      readText: files.readText,
    })

    expect(result.candidates).toHaveLength(0)
  })

  it('leaves a project the Lit adapter claims alone', async () => {
    const directory = project({ dependencies: { lit: '^3.0.0' } }, { 'index.html': '<p>hi</p>' })
    const files = createProjectFiles(directory)
    const result = await detect({
      rootDir: directory,
      files: files.files,
      readText: files.readText,
    })

    expect(result.candidates).toHaveLength(0)
  })

  it('does not claim a library with no document', async () => {
    const result = await detect(bad)

    expect(result.candidates).toHaveLength(0)
  })

  it('refuses a project that declares the native runtime', async () => {
    const directory = project(
      { dependencies: { 'react-native': '^0.86.0' } },
      { 'index.html': '<p>x</p>' },
    )
    const files = createProjectFiles(directory)
    const result = await detect({
      rootDir: directory,
      files: files.files,
      readText: files.readText,
    })

    expect(result.candidates).toHaveLength(0)
  })

  it('refuses a project that declares a Symbiote package', async () => {
    const directory = project(
      { dependencies: { '@symbiote-native/vue': '^2.0.0' } },
      { 'index.html': '<p>x</p>' },
    )
    const files = createProjectFiles(directory)
    const result = await detect({
      rootDir: directory,
      files: files.files,
      readText: files.readText,
    })

    expect(result.candidates).toHaveLength(0)
  })
})

describe('reading documents', () => {
  it('serves a document at its own address', () => {
    expect(documentPattern('index.html')).toBe('/')
    expect(documentPattern('about.html')).toBe('/about.html')
    expect(documentPattern('pages/team.html')).toBe('/pages/team.html')
    expect(documentPattern('pages/index.html')).toBe('/pages')
    expect(isDocument('about.html')).toBe(true)
    expect(isDocument('about.js')).toBe(false)
  })

  it('reads the documents of the fixture', () => {
    const { routes } = readDocuments(app.files, app.readText)

    expect(routes.map((route) => route.pathPattern)).toEqual([
      '/',
      '/about.html',
      '/pages/team.html',
    ])
    expect(routes.every((route) => route.source.adapterId === ADAPTER_ID)).toBe(true)
  })

  it('resolves the module a document names, and only a module it contains', () => {
    const files = ['index.html', 'src/main.js', 'src/lib/api.js']

    expect(resolveDocumentModule('index.html', './src/main.js', files)).toBe('src/main.js')
    expect(resolveDocumentModule('pages/team.html', '../src/lib/api.js', files)).toBe(
      'src/lib/api.js',
    )
    expect(resolveDocumentModule('index.html', '/src/main.js', files)).toBe('src/main.js')
    expect(resolveDocumentModule('index.html', 'https://cdn.example/app.js', files)).toBeUndefined()
    expect(resolveDocumentModule('index.html', './src/gone.js', files)).toBeUndefined()
  })

  it('reports code that lives inside a document', () => {
    const { findings } = readDocuments(app.files, app.readText)

    expect(findings.map((finding) => finding.code)).toEqual(['vanilla-inline-script'])
    expect(findings[0]?.file).toBe('pages/team.html')
  })

  it('reads the link between a document and the module it runs', () => {
    const { scripts } = readDocuments(app.files, app.readText)

    expect(scripts).toEqual([
      { document: 'about.html', module: 'src/views/profile.js' },
      { document: 'index.html', module: 'src/main.js' },
    ])
  })
})

describe('reading modules', () => {
  it('reports a unit for every module, including the one a document loads', async () => {
    const report = await adapter.inspect(app)
    const files = report.units.map((unit) => unit.source.file)

    expect(files).toEqual([
      'src/components/list.js',
      'src/lib/api.js',
      'src/lib/storage.js',
      'src/main.js',
      'src/router.js',
      'src/views/profile.js',
    ])
    expect(report.units.every((unit) => unit.kind === 'utility')).toBe(true)
    expect(report.units.every((unit) => unit.source.adapterId === ADAPTER_ID)).toBe(true)
  })

  it('records which document loads the entry module', async () => {
    const report = await adapter.inspect(app)
    const entry = report.units.find((unit) => unit.source.file === 'src/main.js')

    expect(entry?.metadata).toEqual({ loadedBy: ['index.html'] })
  })

  it('reports no component, layout or state module', async () => {
    const report = await adapter.inspect(app)
    const kinds = [...new Set(report.units.map((unit) => unit.kind))]

    expect(kinds).toEqual(['utility'])
  })

  it('reads the shared capabilities, and the document the project touches', async () => {
    const report = await adapter.inspect(app)

    expect(report.capabilities.map((node) => `${node.capability}:${node.usage}`).sort()).toEqual([
      'dom:unknown',
      'geolocation:invoke',
      'local-storage:read',
      'local-storage:unknown',
      'local-storage:write',
      'network-request:invoke',
    ])
  })

  it('reports routing decided at runtime', async () => {
    const report = await adapter.inspect(app)
    const routing = report.findings.filter((finding) => finding.code === 'vanilla-client-routing')

    expect(routing).toHaveLength(1)
    expect(routing[0]?.severity).toBe('warning')
    expect(routing[0]?.source?.file).toBe('src/router.js')
  })
})

describe('the reading as a graph', () => {
  it('attributes every node to this adapter', async () => {
    const graph = await buildGraph(await adapter.inspect(app))

    expect(graph.routes).toHaveLength(3)
    expect(
      [...graph.routes, ...graph.units, ...graph.capabilities].every((node) =>
        node.id.startsWith('vanilla:'),
      ),
    ).toBe(true)
  })

  it('is deterministic', async () => {
    const first = await buildGraph(await adapter.inspect(app))
    const second = await buildGraph(await adapter.inspect(app))

    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
  })

  it('reads a library as nothing at all', async () => {
    const report = await adapter.inspect(bad)

    expect(report.routes).toHaveLength(0)
    expect(report.findings).toHaveLength(0)
  })

  it('satisfies the adapter contract on both fixtures', async () => {
    expect(await verifyAdapterContract(adapter, app)).toEqual([])
    expect(await verifyAdapterContract(adapter, bad)).toEqual([])
  })
})
