import {
  WORKFLOW_IR_SCHEMA_VERSION,
  hashWorkflow,
  type Action,
  type Binding,
  type Screen,
  type SourceRef,
  type ViewNode,
  type Workflow,
} from '@memolabs-apps/workflow'
import { describe, expect, it } from 'vitest'
import { createNativeTarget } from './index.js'

/**
 * The native target, proven at its public seam.
 *
 * Every case builds a hand-written Workflow IR, calls the registered
 * `TargetProvider.emit`, and asserts only on the returned `EmissionResult`:
 * the emitted file paths, their contents, and the findings. Nothing here
 * reaches into the target's private helpers, and no fixture comes from the
 * source adapter, so the test cannot smuggle in source-framework knowledge.
 */

const SOURCE: SourceRef = { adapterId: 'vue', file: 'src/views/Home.vue', line: 1, column: 1 }

const ACTION_NAMES = ['persistRecord', 'openSettings'] as const

function makeNode(
  id: string,
  primitive: string,
  bindings: readonly Binding[] = [],
  children: readonly ViewNode[] = [],
): ViewNode {
  return {
    id,
    primitive,
    source: SOURCE,
    coverage: { kind: 'generated' },
    bindings,
    children,
  }
}

function makeAction(id: string, name: string): Action {
  return { id, name, source: SOURCE }
}

interface ScreenSpec {
  readonly id: string
  readonly coverage: Screen['coverage']
  readonly nodes?: readonly ViewNode[]
  readonly actions?: readonly Action[]
}

function makeScreen(spec: ScreenSpec): Screen {
  return {
    id: spec.id,
    name: spec.id,
    source: { ...SOURCE, file: `src/views/${spec.id}.vue` },
    coverage: spec.coverage,
    nodes: spec.nodes ?? [],
    state: [],
    actions: spec.actions ?? [],
    layout: [],
    styles: [],
    resources: [],
  }
}

function makeWorkflow(screens: readonly Screen[]): Workflow {
  return { schemaVersion: WORKFLOW_IR_SCHEMA_VERSION, id: 'home-app', screens }
}

/** Flatten a node tree in the order the design says emission follows. */
function flatten(nodes: readonly ViewNode[]): ViewNode[] {
  return nodes.flatMap((node) => [node, ...flatten(node.children)])
}

const generatedScreen = makeScreen({
  id: 'home',
  coverage: { kind: 'generated' },
  nodes: [
    makeNode(
      'home/0',
      'view',
      [{ name: 'testID', expression: 'home-screen', valueKind: 'expression' }],
      [
        makeNode('home/0/0', 'text', [
          { name: 'text', expression: 'label', valueKind: 'expression' },
        ]),
        makeNode('home/0/1', 'pressable', [
          { name: 'on-press', expression: 'onPersist', valueKind: 'expression' },
        ]),
        makeNode('home/0/2', 'text-input', [
          { name: 'v-model', expression: 'name', valueKind: 'expression' },
        ]),
      ],
    ),
  ],
  actions: [
    makeAction('home/action/0', ACTION_NAMES[0]),
    makeAction('home/action/1', ACTION_NAMES[1]),
  ],
})

const generatedWorkflow = makeWorkflow([generatedScreen])

/**
 * The design fixes the finding code and the emitted paths, but it does not fix
 * the manifest key names. These candidates assert the values the design does fix
 * (the IR hash, the emitted path, the screen id) while accepting either name an
 * implementation chose; a wrong or missing value still fails.
 */
function manifestValue<T>(manifest: Record<string, unknown>, candidates: readonly string[]): T {
  for (const key of candidates) {
    if (key in manifest) return manifest[key] as T
  }
  throw new Error(`The manifest names none of: ${candidates.join(', ')}.`)
}

function emittedFile(files: readonly { readonly path: string }[], path: string): string {
  const file = files.find((candidate) => candidate.path === path)
  if (file === undefined) {
    throw new Error(`No emitted file at ${path}; got ${files.map((f) => f.path).join(', ')}.`)
  }
  return (file as { readonly content: string }).content
}

describe('emitting a generated screen', () => {
  it('emits one native component and one provenance manifest at deterministic paths', async () => {
    const target = createNativeTarget()

    const result = await target.emit(generatedWorkflow, { id: 'native-mobile' })

    expect(result.files.map((file) => file.path).sort()).toEqual([
      'generated/home.manifest.json',
      'generated/home.vue',
    ])

    const component = emittedFile(result.files, 'generated/home.vue')
    const manifestContent = emittedFile(result.files, 'generated/home.manifest.json')

    // Each node primitive reaches the template as its own tag.
    for (const node of flatten(generatedScreen.nodes)) {
      expect(component).toContain(`<${node.primitive}`)
    }

    // Each binding carries both its rendered name and its expression.
    for (const node of flatten(generatedScreen.nodes)) {
      for (const binding of node.bindings) {
        const renderedName = binding.name.startsWith('on-')
          ? `@${binding.name.slice(3)}`
          : binding.name
        expect(component).toContain(renderedName)
        expect(component).toContain(binding.expression)
      }
    }

    // A testID binding is emitted verbatim, whatever the quote style.
    expect(component).toMatch(/testID=["']home-screen["']/)

    // Event bindings carry their own handler expression; action metadata is not
    // attached to an arbitrary root node.
    expect(component).toContain('@press="onPersist"')

    const manifest = JSON.parse(manifestContent) as Record<string, unknown>

    expect(manifestValue<string>(manifest, ['irHash', 'workflowHash', 'hash'])).toBe(
      hashWorkflow(generatedWorkflow),
    )
    expect(manifestValue<string>(manifest, ['outputPath', 'path'])).toBe('generated/home.vue')
    expect(manifestValue<string>(manifest, ['screenId', 'screen', 'id'])).toBe('home')
  })
})

describe('refusing a screen the lowering did not cover', () => {
  const kinds = ['refused', 'manual-required', 'excluded'] as const

  for (const kind of kinds) {
    it(`emits no file and a finding for coverage ${kind}`, async () => {
      const screen = makeScreen({
        id: `blocked-${kind}`,
        coverage: { kind },
      })
      const target = createNativeTarget()

      const result = await target.emit(makeWorkflow([screen]), { id: 'native-mobile' })

      expect(result.files).toEqual([])

      const finding = result.findings.find((candidate) => candidate.code === 'uncovered-screen')

      expect(finding).toBeDefined()
      expect(finding?.message).toContain(screen.id)
    })
  }
})

describe('emitting a workflow with a generated and a refused screen', () => {
  it('emits only the generated screen and reports the refused one', async () => {
    const refused = makeScreen({
      id: 'blocked',
      coverage: { kind: 'refused', reason: 'unsupported-watcher' },
    })
    const target = createNativeTarget()

    const result = await target.emit(makeWorkflow([generatedScreen, refused]), {
      id: 'native-mobile',
    })

    expect(result.files.map((file) => file.path).sort()).toEqual([
      'generated/home.manifest.json',
      'generated/home.vue',
    ])
    expect(result.files.some((file) => file.path.includes('blocked'))).toBe(false)

    const finding = result.findings.find((candidate) => candidate.code === 'uncovered-screen')

    expect(finding).toBeDefined()
    expect(finding?.message).toContain('blocked')
    expect(finding?.message).not.toContain('home')
  })
})

describe('emitting the same workflow twice', () => {
  it('yields identical file paths, contents and manifest bytes', async () => {
    const target = createNativeTarget()

    const first = await target.emit(generatedWorkflow, { id: 'native-mobile' })
    const second = await target.emit(generatedWorkflow, { id: 'native-mobile' })

    expect(second.files).toEqual(first.files)
    expect(emittedFile(second.files, 'generated/home.manifest.json')).toBe(
      emittedFile(first.files, 'generated/home.manifest.json'),
    )
  })
})

describe('the emitted native component', () => {
  it('is non-empty and carries an unresolved-placeholder-free template', async () => {
    const target = createNativeTarget()

    const result = await target.emit(generatedWorkflow, { id: 'native-mobile' })
    const component = emittedFile(result.files, 'generated/home.vue')

    expect(component.length).toBeGreaterThan(0)

    const template = component.match(/<template[^>]*>([\s\S]*?)<\/template>/)

    expect(template).not.toBeNull()
    expect(template?.[1]?.trim().length ?? 0).toBeGreaterThan(0)
    expect(component).not.toMatch(/placeholder|<%|__[A-Z][A-Z0-9_]*__|TODO|FIXME/i)
  })

  it('emits Vue bindings as executable syntax', async () => {
    const target = createNativeTarget()
    const result = await target.emit(generatedWorkflow, { id: 'native-mobile' })
    const component = emittedFile(result.files, 'generated/home.vue')

    expect(component).toContain('{{ label }}')
    expect(component).toContain('@press="onPersist"')
    expect(component).toContain('v-model="name"')
    expect(component).not.toContain('on-press=')
    expect(component).not.toContain('text="label"')
  })

  it('emits literal text without expression delimiters', async () => {
    const screen = makeScreen({
      id: 'literal',
      coverage: { kind: 'generated' },
      nodes: [
        makeNode('literal/0', 'text', [
          { name: 'text', expression: 'Hello world', valueKind: 'literal' },
        ]),
      ],
    })
    const target = createNativeTarget()

    const result = await target.emit(makeWorkflow([screen]), { id: 'native-mobile' })
    const component = emittedFile(result.files, 'generated/literal.vue')

    expect(component).toContain('<text>Hello world</text>')
    expect(component).not.toContain('{{ Hello world }}')
  })

  it('escapes literal text that contains SFC or interpolation syntax', async () => {
    const screen = makeScreen({
      id: 'literal-special',
      coverage: { kind: 'generated' },
      nodes: [
        makeNode('literal-special/0', 'text', [
          { name: 'text', expression: '<Hello> & {{ label }}', valueKind: 'literal' },
        ]),
      ],
    })
    const target = createNativeTarget()

    const result = await target.emit(makeWorkflow([screen]), { id: 'native-mobile' })
    const component = emittedFile(result.files, 'generated/literal-special.vue')

    expect(component).toContain('<text>&lt;Hello&gt; &amp; &#123;&#123; label &#125;&#125;</text>')
    expect(component).not.toContain('{{ label }}')
  })

  it('derives import-safe stems from graph-style screen ids', async () => {
    const graphScreen = {
      ...makeScreen({
        id: 'vue:src/views/Home.vue:screen:default',
        coverage: { kind: 'generated' },
      }),
      id: 'vue:src/views/Home.vue:screen:default',
      name: 'Home',
      nodes: generatedScreen.nodes,
    }
    const target = createNativeTarget()

    const result = await target.emit(makeWorkflow([graphScreen]), { id: 'native-mobile' })

    expect(result.files.map((file) => file.path)).toEqual([
      'generated/Home.vue',
      'generated/Home.manifest.json',
    ])
    expect(emittedFile(result.files, 'generated/Home.vue')).toContain('<view')
  })
})
