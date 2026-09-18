import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProjectFiles, verifyAdapterContract } from '@navirox/source'
import { describe, expect, it } from 'vitest'
import {
  ADAPTER_ID,
  buildGraph,
  configuresRouter,
  createLitAdapter,
  detect,
  isComponentExtension,
  readDeclaration,
  readRoutes,
  routePattern,
} from './index'

function fixture(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))
}

function project(manifest: Record<string, unknown>): string {
  const directory = mkdtempSync(join(tmpdir(), 'navirox-lit-'))
  writeFileSync(join(directory, 'package.json'), JSON.stringify(manifest))
  return directory
}

const adapter = createLitAdapter()
const app = createProjectFiles(fixture('lit-app'))
const bad = createProjectFiles(fixture('lit-bad'))

describe('detecting Lit, and refusing the target', () => {
  it('recognizes a project that declares lit', async () => {
    const result = await detect(app)

    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0]?.confidence).toBe('high')
    expect(result.candidates[0]?.evidence[0]?.value).toContain('dependencies.lit')
  })

  it('declares the range it was exercised against', () => {
    expect(adapter.testedVersions).toEqual([{ framework: 'lit', versions: ['^3.0.0'] }])
    expect(adapter.composes).toBeUndefined()
  })

  it('does not claim a project that declares another framework', async () => {
    const result = await detect(createProjectFiles(project({ dependencies: { vue: '^3.5.43' } })))

    expect(result.candidates).toEqual([])
  })

  it('refuses a project that already declares the native runtime', async () => {
    const native = await detect(
      createProjectFiles(project({ dependencies: { lit: '^3.3.3', 'react-native': '0.86.0' } })),
    )
    const symbiote = await detect(
      createProjectFiles(
        project({ dependencies: { lit: '^3.3.3', '@symbiote-native/vue': '2.0.0' } }),
      ),
    )

    expect(native.candidates).toEqual([])
    expect(symbiote.candidates).toEqual([])
  })
})

describe('reading a component as the element it registers', () => {
  it('reads the decorator form', () => {
    const declaration = readDeclaration(
      [
        "import { LitElement } from 'lit'",
        "import { customElement, state } from 'lit/decorators.js'",
        '',
        "@customElement('my-element')",
        'export class MyElement extends LitElement {',
        '  @state()',
        '  private count = 0',
        '}',
      ].join('\n'),
    )

    expect(declaration.element).toBe(true)
    expect(declaration.registration).toBe('decorator')
    expect(declaration.tagName).toBe('my-element')
    expect(declaration.declaresProperty).toBe(true)
  })

  it('reads the direct registration form', () => {
    const declaration = readDeclaration(
      [
        "import { LitElement } from 'lit'",
        '',
        'export class MyElement extends LitElement {',
        '  static properties = { count: { type: Number } }',
        '}',
        '',
        "customElements.define('my-element', MyElement)",
      ].join('\n'),
    )

    expect(declaration.element).toBe(true)
    expect(declaration.registration).toBe('define')
    expect(declaration.tagName).toBe('my-element')
    expect(declaration.declaresProperty).toBe(true)
  })

  it('recognizes ReactiveElement as a base too', () => {
    expect(readDeclaration('export class X extends ReactiveElement {}').element).toBe(true)
  })

  it('does not call a plain class a component', () => {
    expect(readDeclaration('export class Helper { run(): void {} }').element).toBe(false)
  })

  it('leaves type declarations out of the component extensions', () => {
    expect(isComponentExtension('src/x.d.ts')).toBe(false)
    expect(isComponentExtension('src/x.ts')).toBe(true)
  })
})

describe('reading the routes a project declares', () => {
  it('reads every path literal, and only the paths', () => {
    const { routes } = readRoutes(app.files, app.readText)

    expect(routes.map((route) => route.key)).toEqual(['/', '/admin', '/child/*', '/profile/:id'])
    expect(routes.every((route) => route.source.adapterId === ADAPTER_ID)).toBe(true)
    expect(routes.find((route) => route.key === '/profile/:id')?.params).toEqual(['id'])
  })

  it('keeps a trailing wildcard as the prefix a child is mounted under', () => {
    expect(routePattern('/child/*')).toBe('/child/*')
    expect(routePattern('')).toBe('/')
    expect(routePattern('*')).toBe('/')
    expect(routePattern('about')).toBe('/about')
  })

  it('reports a URLPattern route instead of inventing a path', () => {
    const { routes, findings } = readRoutes(app.files, app.readText)

    expect(routes.some((route) => route.key.includes('legacy'))).toBe(false)
    expect(findings.map((finding) => finding.code)).toContain('lit-route-pattern-object')
  })

  it('reports an enter callback it does not resolve', () => {
    const { findings } = readRoutes(app.files, app.readText)

    expect(findings.map((finding) => finding.code)).toContain('lit-route-enter')
  })

  it('tells a router configuration apart from a plain module', () => {
    expect(configuresRouter("const routes = [{ path: '/' }]")).toBe(false)
    expect(configuresRouter('class App { private router = new Router(this, []) }')).toBe(true)
    expect(configuresRouter('class App { private routes = new Routes(this, []) }')).toBe(true)
  })
})

describe('units and capabilities', () => {
  it('never produces a state module', async () => {
    const report = await inspect()
    const kinds = [...new Set(report.units.map((unit) => unit.kind))].sort()

    expect(kinds).toEqual(['component', 'utility'])
    expect(report.units.some((unit) => unit.kind === 'state-module')).toBe(false)
  })

  it('keeps the reactive property declaration as metadata', async () => {
    const report = await inspect()
    const unit = report.units.find((entry) => entry.source.file === 'src/app-element.ts')

    expect(unit?.kind).toBe('component')
    expect(unit?.metadata?.declaresProperty).toBe(true)
    expect(unit?.metadata?.tagName).toBe('app-root')
  })

  it('reads both registration forms as components', async () => {
    const report = await inspect()

    expect(
      report.units.find((entry) => entry.source.file === 'src/components/counter-element.ts')
        ?.metadata?.registration,
    ).toBe('decorator')
    expect(
      report.units.find((entry) => entry.source.file === 'src/components/list-element.ts')?.metadata
        ?.registration,
    ).toBe('define')
  })

  it('reads the shared capabilities, and only those', async () => {
    const report = await inspect()

    expect(report.capabilities.map((entry) => `${entry.capability}:${entry.usage}`).sort()).toEqual(
      [
        'geolocation:invoke',
        'local-storage:read',
        'local-storage:unknown',
        'local-storage:write',
        'network-request:invoke',
      ],
    )
  })

  async function inspect() {
    return adapter.inspect(app)
  }
})

describe('the Lit reading as a graph', () => {
  it('is deterministic, and names this adapter', async () => {
    const first = await buildGraph(await adapter.inspect(app))
    const second = await buildGraph(await adapter.inspect(app))
    const ids = [
      ...first.units.map((node) => node.id),
      ...first.routes.map((node) => node.id),
      ...first.capabilities.map((node) => node.id),
    ]

    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
    expect(ids.every((id) => id.startsWith('lit:'))).toBe(true)
    expect(first.routes).toHaveLength(4)
  })

  it('reports an untested major rather than assuming support', async () => {
    const report = await adapter.inspect(bad)
    const finding = report.findings.find((entry) => entry.code === 'version-untested')

    expect(finding?.severity).toBe('warning')
    expect(finding?.message).toContain('^2.8.0')
  })

  it('passes the adapter contract on both fixtures', async () => {
    expect(await verifyAdapterContract(adapter, app)).toEqual([])
    expect(await verifyAdapterContract(adapter, bad)).toEqual([])
  })
})
