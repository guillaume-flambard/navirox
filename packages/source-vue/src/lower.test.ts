import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { APP_GRAPH_SCHEMA_VERSION, type AppGraph } from '@memolabs-apps/graph'
import { createProjectFiles } from '@memolabs-apps/source'
import type { LoweringResult } from '@memolabs-apps/source'
import {
  hashWorkflow,
  serializeWorkflow,
  validateWorkflow,
  type ViewNode,
} from '@memolabs-apps/workflow'
import { afterEach, describe, expect, it } from 'vitest'
import { buildGraph, inspect } from './index.js'
import { createVueLowering } from './lower.js'

/**
 * The Vue lowering, proven at its public seam.
 *
 * Each case builds a real App Graph from a fixture project exactly as the
 * pipeline does, lowers it, and asserts on the Workflow IR and the findings.
 * Nothing here reaches into the lowering's private helpers.
 */

function fixture(name: string): string {
  return fileURLToPath(new URL(`../fixtures/vue-workflow-lowering/${name}`, import.meta.url))
}

async function graphOf(rootDir: string): Promise<AppGraph> {
  const inspection = await inspect(createProjectFiles(rootDir))
  const fragment = await buildGraph(inspection, { rootDir })

  return {
    ...fragment,
    schemaVersion: APP_GRAPH_SCHEMA_VERSION,
    source: inspection.descriptor,
  }
}

async function lowerFixture(
  name: string,
): Promise<{ readonly result: LoweringResult; readonly graph: AppGraph }> {
  const rootDir = fixture(name)
  const graph = await graphOf(rootDir)
  const result = await createVueLowering().lower(
    { rootDir },
    { adapterId: 'vue', graph },
    { id: 'vue-mobile' },
  )

  return { result, graph }
}

function flatten(nodes: readonly ViewNode[]): ViewNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)])
}

function codes(findings: readonly { readonly code: string }[]): string[] {
  return findings.map((finding) => finding.code)
}

interface NodeShape {
  readonly primitive: string
  readonly bindings: readonly string[]
}

/** The flattened node tree as primitive plus binding names, so a wrong tag map fails. */
function treeShape(nodes: readonly ViewNode[]): NodeShape[] {
  return flatten(nodes).map((node) => ({
    primitive: node.primitive,
    bindings: node.bindings.map((binding) => binding.name),
  }))
}

const tempDirs: string[] = []

function makeTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('lowering a covered Vue screen', () => {
  it('emits the exact generated node tree, state, bindings and actions', async () => {
    const { result, graph } = await lowerFixture('positive')

    expect(result.workflow.screens).toHaveLength(1)

    const screen = result.workflow.screens[0]
    const graphScreen = graph.screens[0]

    expect(screen).toBeDefined()
    expect(graphScreen).toBeDefined()

    if (screen === undefined || graphScreen === undefined) {
      return
    }

    expect(screen.coverage.kind).toBe('generated')
    expect(screen.id).toContain(graphScreen.id)

    // State is emitted in document order with the kind each declaration carries.
    expect(screen.state).toEqual([
      { name: 'count', kind: 'ref' },
      { name: 'label', kind: 'computed' },
      { name: 'items', kind: 'ref' },
      { name: 'title', kind: 'props' },
      { name: 'submit', kind: 'emits' },
    ])

    // The whole flattened tree, so a wrong primitive mapping or a dropped
    // directive binding fails rather than passing a shape-only assertion.
    expect(treeShape(screen.nodes)).toEqual([
      { primitive: 'text', bindings: [] },
      { primitive: 'text', bindings: ['text'] },
      { primitive: 'text', bindings: ['title'] },
      { primitive: 'text', bindings: ['text'] },
      { primitive: 'text', bindings: ['v-if'] },
      { primitive: 'text', bindings: ['text'] },
      { primitive: 'text', bindings: ['v-else'] },
      { primitive: 'text', bindings: ['text'] },
      { primitive: 'view', bindings: [] },
      { primitive: 'view', bindings: ['v-for', 'key'] },
      { primitive: 'text', bindings: ['text'] },
      { primitive: 'text-input', bindings: ['v-model'] },
      { primitive: 'pressable', bindings: ['on-click'] },
      { primitive: 'text', bindings: ['text'] },
    ])

    // A binding carries its expression, not only its name.
    const nodes = flatten(screen.nodes)
    const conditional = nodes.find((node) => node.bindings.some((b) => b.name === 'v-if'))

    expect(conditional?.bindings[0]?.expression).toBe('count > 0')

    expect(nodes.every((node) => node.coverage.kind === 'generated')).toBe(true)
    expect(nodes.every((node) => node.source.file === 'src/views/Home.vue')).toBe(true)
    expect(nodes.every((node) => node.source.line !== undefined)).toBe(true)

    expect(screen.actions.map((action) => action.name)).toEqual(['click'])
    expect(screen.actions.every((action) => action.source.file === 'src/views/Home.vue')).toBe(true)

    expect(validateWorkflow(result.workflow)).toEqual([])

    // The covered screen is the finding-free path: nothing is refused or dropped.
    expect(result.findings).toEqual([])
    expect(result.coverage.refused).toBe(0)
    expect(result.coverage.generated).toBeGreaterThan(0)
  })
})

describe('lowering a screen that mixes covered and refused constructs', () => {
  it('refuses the whole screen and names the watcher', async () => {
    const { result } = await lowerFixture('boundary')

    expect(result.workflow.screens).toHaveLength(1)

    const screen = result.workflow.screens[0]

    expect(screen).toBeDefined()

    if (screen === undefined) {
      return
    }

    expect(screen.coverage.kind).toBe('refused')
    expect(screen.nodes).toEqual([])
    expect(screen.coverage.reason).toContain('unsupported-watcher')
    expect(codes(result.findings)).toEqual(['unsupported-watcher'])

    const finding = result.findings.find((candidate) => candidate.code === 'unsupported-watcher')

    expect(finding?.message).toContain('src/views/Watched.vue:6')
  })
})

describe('lowering screens with constructs outside the profile', () => {
  it('refuses each screen and records one finding per construct', async () => {
    const { result } = await lowerFixture('refused')

    expect(result.workflow.screens).toHaveLength(2)
    expect(result.workflow.screens.every((screen) => screen.coverage.kind === 'refused')).toBe(true)
    expect(result.workflow.screens.every((screen) => screen.nodes.length === 0)).toBe(true)
    expect(codes(result.findings)).toEqual(
      expect.arrayContaining([
        'unsupported-render-function',
        'unsupported-dynamic-component',
        'unsupported-script-setup',
      ]),
    )

    // Each finding names the file it came from, with the line where known.
    expect(result.findings.every((finding) => finding.message.includes('.vue:'))).toBe(true)

    const render = result.findings.filter((finding) =>
      finding.message.includes('RenderFunction.vue'),
    )

    expect(codes(render)).toEqual(
      expect.arrayContaining(['unsupported-render-function', 'unsupported-script-setup']),
    )
    expect(render.some((finding) => finding.message.includes('RenderFunction.vue:6'))).toBe(true)

    const dynamic = result.findings.filter((finding) =>
      finding.message.includes('DynamicComponent.vue'),
    )

    expect(codes(dynamic)).toEqual(
      expect.arrayContaining(['unsupported-dynamic-component', 'unsupported-script-setup']),
    )
    expect(dynamic.some((finding) => finding.message.includes('DynamicComponent.vue:10'))).toBe(
      true,
    )
  })
})

describe('lowering a screen with one construct outside the profile', () => {
  interface RefusalCase {
    readonly fixture: string
    readonly code: string
    readonly location: string
    readonly detail: string
  }

  async function expectRefused(testCase: RefusalCase): Promise<void> {
    const { result } = await lowerFixture(testCase.fixture)

    expect(result.workflow.screens).toHaveLength(1)

    const screen = result.workflow.screens[0]

    expect(screen).toBeDefined()

    if (screen === undefined) {
      return
    }

    expect(screen.coverage.kind).toBe('refused')
    expect(screen.nodes).toEqual([])
    expect(screen.coverage.reason).toContain(testCase.code)
    expect(result.coverage.refused).toBe(1)

    const finding = result.findings.find((candidate) => candidate.code === testCase.code)

    expect(finding).toBeDefined()
    // The seam carries no location field, so the file and line travel in the message.
    expect(finding?.message).toContain(testCase.location)
    expect(finding?.message).toContain(testCase.detail)
  }

  it('refuses a tag outside the closed primitive map', async () => {
    await expectRefused({
      fixture: 'unsupported-element',
      code: 'unsupported-element',
      location: 'src/views/CustomWidget.vue:8',
      detail: 'MyWidget',
    })
  })

  it('refuses a directive outside the covered set', async () => {
    await expectRefused({
      fixture: 'unsupported-directive',
      code: 'unsupported-directive',
      location: 'src/views/RawHtml.vue:8',
      detail: 'v-html',
    })
  })

  it('refuses a state macro the lowering cannot classify', async () => {
    await expectRefused({
      fixture: 'unsupported-state-macro',
      code: 'unsupported-state-macro',
      location: 'src/views/MacroScreen.vue:2',
      detail: 'withDefaults',
    })
  })
})

describe('lowering the same input twice', () => {
  it('produces identical serialized bytes and the same hash', async () => {
    const first = await lowerFixture('positive')
    const second = await lowerFixture('positive')

    expect(serializeWorkflow(second.result.workflow)).toBe(serializeWorkflow(first.result.workflow))
    expect(hashWorkflow(second.result.workflow)).toBe(hashWorkflow(first.result.workflow))
  })
})

describe('lowering a screen whose file cannot be read', () => {
  it('refuses the screen and names the file', async () => {
    const rootDir = makeTempDir('navirox-vue-lowering-missing-')
    const graph: AppGraph = {
      schemaVersion: APP_GRAPH_SCHEMA_VERSION,
      source: { adapterId: 'vue', displayName: 'Vue' },
      routes: [],
      screens: [
        {
          id: 'vue:src/views/Missing.vue:screen:default',
          unitId: 'vue:src/views/Missing.vue:component:default',
          routeIds: [],
          source: { file: 'src/views/Missing.vue', adapterId: 'vue' },
        },
      ],
      units: [
        {
          id: 'vue:src/views/Missing.vue:component:default',
          kind: 'component',
          source: { file: 'src/views/Missing.vue', adapterId: 'vue' },
          dependencies: [],
        },
      ],
      actions: [],
      data: [],
      capabilities: [],
      dependencies: [],
      edges: [],
      findings: [],
    }

    const result = await createVueLowering().lower(
      { rootDir },
      { adapterId: 'vue', graph },
      { id: 'vue-mobile' },
    )

    expect(result.workflow.screens).toHaveLength(1)

    const screen = result.workflow.screens[0]

    expect(screen).toBeDefined()

    if (screen === undefined) {
      return
    }

    expect(screen.coverage.kind).toBe('refused')
    expect(screen.nodes).toEqual([])

    const finding = result.findings.find((candidate) => candidate.code === 'unreadable-screen')

    expect(finding).toBeDefined()
    expect(finding?.message).toContain('Missing.vue')
  })
})
