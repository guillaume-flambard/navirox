import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { type SFCDescriptor, babelParse, parse } from '@vue/compiler-sfc'
import {
  WORKFLOW_IR_SCHEMA_VERSION,
  type Action,
  type Binding,
  type Screen,
  type SourceRef,
  type StateModel,
  type ViewNode,
  type Workflow,
} from '@memolabs-apps/workflow'
import type {
  LoweringFinding,
  LoweringResult,
  LoweringSelection,
  LoweringSnapshot,
  SourceTransformProvider,
} from '@memolabs-apps/source'
import type { AppGraph, ScreenNode, UnitNode } from '@memolabs-apps/graph'
import { ADAPTER_ID } from './detect.js'

/**
 * The Vue lowering.
 *
 * It reads the screen units the App Graph names, parses their single file
 * components, and turns the declared `<script setup>` and template profile into
 * the Workflow IR. A construct outside the profile refuses the whole screen: a
 * half-lowered screen is worse than a named refusal, because a target cannot
 * tell "covered" from "silently dropped".
 */

const PROVIDER_ID = 'vue-workflow-lowering'

// The stable template node tags of the Vue compiler. Spelled out because this
// adapter reads the template AST structurally and must not import a second
// framework package to name them.
const NODE_ROOT = 0
const NODE_ELEMENT = 1
const NODE_TEXT = 2
const NODE_INTERPOLATION = 5
const NODE_DIRECTIVE = 7

// The closed set of mapped elements. An element outside it refuses the screen.
const PRIMITIVES: Readonly<Record<string, string>> = {
  a: 'link',
  button: 'pressable',
  div: 'view',
  footer: 'view',
  form: 'view',
  h1: 'text',
  h2: 'text',
  h3: 'text',
  h4: 'text',
  h5: 'text',
  h6: 'text',
  header: 'view',
  img: 'image',
  input: 'text-input',
  label: 'text',
  li: 'view',
  main: 'view',
  nav: 'view',
  ol: 'view',
  option: 'picker-item',
  p: 'text',
  section: 'view',
  select: 'picker',
  span: 'text',
  table: 'view',
  tbody: 'view',
  td: 'view',
  textarea: 'text-input',
  th: 'view',
  thead: 'view',
  tr: 'view',
  ul: 'view',
}

const COVERED_DIRECTIVES: ReadonlySet<string> = new Set([
  'bind',
  'else',
  'else-if',
  'for',
  'if',
  'model',
  'on',
])

// Top-level Vue macros the closed profile cannot classify. A screen that uses
// one is refused rather than emitted with silently missing state.
const UNCLASSIFIED_STATE_MACROS: ReadonlySet<string> = new Set([
  'defineExpose',
  'defineModel',
  'defineOptions',
  'defineSlots',
  'withDefaults',
])

// Destructuring these discards the declared member names the state model needs.
const DESTRUCTURED_STATE_SOURCES: ReadonlySet<string> = new Set(['defineProps', 'reactive'])

type Rec = { readonly [key: string]: unknown }

interface ReadOk {
  readonly ok: true
  readonly descriptor: SFCDescriptor
}

interface ReadFail {
  readonly ok: false
  readonly message: string
}

interface BuiltScreen {
  readonly nodes: readonly ViewNode[]
  readonly state: readonly StateModel[]
  readonly actions: readonly Action[]
}

function isRecord(value: unknown): value is Rec {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asRec(value: unknown): Rec | undefined {
  return isRecord(value) ? value : undefined
}

function asRecs(value: unknown): readonly Rec[] {
  return Array.isArray(value) ? value.filter(isRecord) : []
}

function nameOf(node: Rec | undefined): string | undefined {
  const name = node?.['name']
  return typeof name === 'string' ? name : undefined
}

function literalName(node: Rec | undefined): string | undefined {
  if (node === undefined) return undefined
  const type = node['type']
  const value = node['value']
  return (type === 'StringLiteral' || type === 'Literal') && typeof value === 'string'
    ? value
    : undefined
}

function keyName(node: Rec | undefined): string | undefined {
  return nameOf(node) ?? literalName(node)
}

function locStart(loc: unknown): Rec | undefined {
  return asRec(asRec(loc)?.['start'])
}

function lineOf(node: Rec | undefined): number | undefined {
  const line = locStart(node?.['loc'])?.['line']
  return typeof line === 'number' ? line : undefined
}

function sourceOf(file: string, loc: unknown): SourceRef {
  const start = locStart(loc)
  const line = start?.['line']
  const column = start?.['column']

  if (typeof line !== 'number') {
    return { adapterId: ADAPTER_ID, file }
  }

  return typeof column === 'number'
    ? { adapterId: ADAPTER_ID, file, line, column }
    : { adapterId: ADAPTER_ID, file, line }
}

function expText(value: unknown): string | undefined {
  const node = asRec(value)
  if (node === undefined) return undefined

  const content = node['content']
  if (typeof content === 'string') return content

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part
        const partContent = asRec(part)?.['content']
        return typeof partContent === 'string' ? partContent : ''
      })
      .join('')
  }

  return undefined
}

function argText(value: unknown): string | undefined {
  const node = asRec(value)
  if (node === undefined) return undefined

  const content = node['content']
  if (typeof content === 'string') return content

  return nameOf(node)
}

function templateRoot(descriptor: SFCDescriptor): Rec | undefined {
  const template = descriptor.template
  return template === null ? undefined : asRec(template.ast)
}

function directivesOf(element: Rec): readonly Rec[] {
  return asRecs(element['props']).filter((prop) => prop['type'] === NODE_DIRECTIVE)
}

function hasIsBinding(element: Rec): boolean {
  return directivesOf(element).some(
    (directive) => directive['name'] === 'bind' && argText(directive['arg']) === 'is',
  )
}

function collectElements(root: Rec): Rec[] {
  const elements: Rec[] = []

  const visit = (node: Rec): void => {
    const type = node['type']

    if (type === NODE_ELEMENT) {
      elements.push(node)
      for (const child of asRecs(node['children'])) visit(child)
      return
    }

    if (type === NODE_ROOT) {
      for (const child of asRecs(node['children'])) visit(child)
    }
  }

  visit(root)
  return elements
}

function findLine(text: string, pattern: RegExp): number | undefined {
  const lines = text.split('\n')

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (line !== undefined && pattern.test(line)) return index + 1
  }

  return undefined
}

function errorMessage(error: unknown): string {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  return String(error)
}

function refusal(
  code: string,
  file: string,
  line: number | undefined,
  detail: string,
): LoweringFinding {
  const where = line === undefined ? file : `${file}:${line}`
  return { code, message: `${where} ${detail}` }
}

function scriptBlocks(
  descriptor: SFCDescriptor,
): readonly { readonly content: string; readonly startLine: number }[] {
  const blocks: { readonly content: string; readonly startLine: number }[] = []

  for (const block of [descriptor.script, descriptor.scriptSetup]) {
    if (block === null) continue
    blocks.push({ content: block.content, startLine: lineOf(asRec(block)) ?? 1 })
  }

  return blocks
}

function macroCallLine(startLine: number, node: Rec): number | undefined {
  const line = lineOf(node)
  return line === undefined ? undefined : startLine + line - 1
}

function stateMacroRefusals(descriptor: SFCDescriptor, file: string): LoweringFinding[] {
  const setup = descriptor.scriptSetup
  if (setup === null) return []

  const program = parseScript(setup.content, setup.lang)
  if (program === undefined) return []

  const startLine = lineOf(asRec(setup)) ?? 1
  const findings: LoweringFinding[] = []

  for (const statement of asRecs(program['body'])) {
    if (statement['type'] === 'ExpressionStatement') {
      const expression = asRec(statement['expression'])
      if (expression === undefined || expression['type'] !== 'CallExpression') continue

      const callee = nameOf(asRec(expression['callee']))
      if (callee !== undefined && UNCLASSIFIED_STATE_MACROS.has(callee)) {
        findings.push(
          refusal(
            'unsupported-state-macro',
            file,
            macroCallLine(startLine, expression),
            `uses ${callee}(), which the lowering cannot classify.`,
          ),
        )
      }
      continue
    }

    if (statement['type'] !== 'VariableDeclaration') continue

    for (const declaration of asRecs(statement['declarations'])) {
      const init = asRec(declaration['init'])
      if (init === undefined || init['type'] !== 'CallExpression') continue

      const callee = nameOf(asRec(init['callee']))
      if (callee === undefined) continue

      if (UNCLASSIFIED_STATE_MACROS.has(callee)) {
        findings.push(
          refusal(
            'unsupported-state-macro',
            file,
            macroCallLine(startLine, init),
            `uses ${callee}(), which the lowering cannot classify.`,
          ),
        )
        continue
      }

      if (
        DESTRUCTURED_STATE_SOURCES.has(callee) &&
        asRec(declaration['id'])?.['type'] === 'ObjectPattern'
      ) {
        findings.push(
          refusal(
            'unsupported-state-macro',
            file,
            macroCallLine(startLine, init),
            `destructures ${callee}(), which the lowering cannot classify.`,
          ),
        )
      }
    }
  }

  return findings
}

function collectRefusals(descriptor: SFCDescriptor, file: string): LoweringFinding[] {
  const findings: LoweringFinding[] = []

  if (descriptor.script !== null && descriptor.scriptSetup === null) {
    findings.push(
      refusal(
        'unsupported-script-setup',
        file,
        lineOf(asRec(descriptor.script)),
        'uses a <script> block without setup.',
      ),
    )
  }

  for (const block of scriptBlocks(descriptor)) {
    const renderLine = findLine(block.content, /\bh\s*\(/)
    if (renderLine !== undefined) {
      findings.push(
        refusal(
          'unsupported-render-function',
          file,
          block.startLine + renderLine - 1,
          'uses a render function.',
        ),
      )
    }

    const watchLine = findLine(block.content, /\bwatch(?:Effect)?\s*\(/)
    if (watchLine !== undefined) {
      findings.push(
        refusal(
          'unsupported-watcher',
          file,
          block.startLine + watchLine - 1,
          'uses watch() or watchEffect().',
        ),
      )
    }
  }

  findings.push(...stateMacroRefusals(descriptor, file))

  const root = templateRoot(descriptor)
  if (root === undefined) return findings

  for (const element of collectElements(root)) {
    const tag = typeof element['tag'] === 'string' ? element['tag'] : ''

    if (tag === 'component' && hasIsBinding(element)) {
      findings.push(
        refusal('unsupported-dynamic-component', file, lineOf(element), 'uses <component :is>.'),
      )
      continue
    }

    if (PRIMITIVES[tag] === undefined) {
      findings.push(
        refusal(
          'unsupported-element',
          file,
          lineOf(element),
          `has no primitive mapping for <${tag}>.`,
        ),
      )
      continue
    }

    for (const directive of directivesOf(element)) {
      const name = typeof directive['name'] === 'string' ? directive['name'] : ''
      if (!COVERED_DIRECTIVES.has(name)) {
        findings.push(refusal('unsupported-directive', file, lineOf(directive), `uses v-${name}.`))
      }
    }
  }

  return findings
}

function parseScript(content: string, lang: string | undefined): Rec | undefined {
  const plugins = lang !== undefined && lang.startsWith('ts') ? ['typescript'] : []
  const parseBabel = babelParse as unknown as (
    code: string,
    options: { readonly sourceType: string; readonly plugins: readonly string[] },
  ) => unknown

  try {
    return asRec(asRec(parseBabel(content, { sourceType: 'module', plugins }))?.['program'])
  } catch {
    return undefined
  }
}

function typeLiteralMembers(call: Rec): readonly Rec[] {
  const typeNode = asRec(call['typeParameters']) ?? asRec(call['typeArguments'])
  const first = asRecs(typeNode?.['params'])[0]

  return first !== undefined && first['type'] === 'TSTypeLiteral' ? asRecs(first['members']) : []
}

function eventNameOf(parameter: Rec | undefined): string | undefined {
  if (parameter === undefined) return undefined

  const annotation = asRec(parameter['typeAnnotation'])
  const typeNode = asRec(annotation?.['typeAnnotation'])
  if (typeNode === undefined) return undefined

  if (typeNode['type'] === 'TSLiteralType') return literalName(asRec(typeNode['literal']))

  if (typeNode['type'] === 'TSUnionType') {
    for (const member of asRecs(typeNode['types'])) {
      const name =
        member['type'] === 'TSLiteralType' ? literalName(asRec(member['literal'])) : undefined
      if (name !== undefined) return name
    }
  }

  return undefined
}

function argumentNames(call: Rec): string[] {
  const argument = asRecs(call['arguments'])[0]
  if (argument === undefined) return []

  if (argument['type'] === 'ObjectExpression') {
    const names: string[] = []
    for (const property of asRecs(argument['properties'])) {
      if (property['type'] !== 'ObjectProperty') continue
      const name = keyName(asRec(property['key']))
      if (name !== undefined) names.push(name)
    }
    return names
  }

  if (argument['type'] === 'ArrayExpression') {
    const names: string[] = []
    for (const element of asRecs(argument['elements'])) {
      const name = literalName(element)
      if (name !== undefined) names.push(name)
    }
    return names
  }

  return []
}

function macroNames(call: Rec, kind: 'props' | 'emits'): string[] {
  const members = typeLiteralMembers(call)

  if (members.length > 0) {
    const names: string[] = []

    for (const member of members) {
      if (kind === 'props') {
        if (member['type'] === 'TSPropertySignature' || member['type'] === 'TSMethodSignature') {
          const name = keyName(asRec(member['key']))
          if (name !== undefined) names.push(name)
        }
        continue
      }

      if (member['type'] === 'TSCallSignatureDeclaration') {
        const name = eventNameOf(asRecs(member['parameters'])[0])
        if (name !== undefined) names.push(name)
      } else if (member['type'] === 'TSPropertySignature') {
        const name = keyName(asRec(member['key']))
        if (name !== undefined) names.push(name)
      }
    }

    return names
  }

  return argumentNames(call)
}

function collectMacro(call: Rec, state: StateModel[]): void {
  const callee = nameOf(asRec(call['callee']))

  if (callee === 'defineProps') {
    for (const name of macroNames(call, 'props')) state.push({ name, kind: 'props' })
  } else if (callee === 'defineEmits') {
    for (const name of macroNames(call, 'emits')) state.push({ name, kind: 'emits' })
  }
}

function collectDeclaration(declaration: Rec, state: StateModel[]): void {
  const init = asRec(declaration['init'])
  if (init === undefined || init['type'] !== 'CallExpression') return

  const callee = nameOf(asRec(init['callee']))

  if (callee === 'ref' || callee === 'reactive' || callee === 'computed') {
    const name = nameOf(asRec(declaration['id']))
    if (name !== undefined) state.push({ name, kind: callee })
    return
  }

  collectMacro(init, state)
}

function collectState(descriptor: SFCDescriptor): StateModel[] {
  const setup = descriptor.scriptSetup
  if (setup === null) return []

  const program = parseScript(setup.content, setup.lang)
  if (program === undefined) return []

  const state: StateModel[] = []

  for (const statement of asRecs(program['body'])) {
    const type = statement['type']

    if (type === 'VariableDeclaration') {
      for (const declaration of asRecs(statement['declarations'])) {
        collectDeclaration(declaration, state)
      }
    } else if (type === 'ExpressionStatement') {
      const expression = asRec(statement['expression'])
      if (expression !== undefined && expression['type'] === 'CallExpression') {
        collectMacro(expression, state)
      }
    }
  }

  return state
}

function nodeId(screenId: string, path: string): string {
  return `${screenId}/node/${path}`
}

function directiveBinding(directive: Rec): Binding | undefined {
  const name = typeof directive['name'] === 'string' ? directive['name'] : ''
  const expression = expText(directive['exp']) ?? ''

  switch (name) {
    case 'bind':
      return { name: argText(directive['arg']) ?? 'v-bind', expression }
    case 'if':
      return { name: 'v-if', expression }
    case 'else-if':
      return { name: 'v-else-if', expression }
    case 'else':
      return { name: 'v-else', expression: '' }
    case 'for':
      return { name: 'v-for', expression }
    case 'on':
      return { name: `on-${argText(directive['arg']) ?? 'event'}`, expression }
    case 'model':
      return { name: 'v-model', expression }
    default:
      return undefined
  }
}

function buildChildren(
  children: readonly Rec[],
  parentPath: string,
  screenId: string,
  file: string,
  actions: Action[],
  out: ViewNode[],
): void {
  let index = 0

  for (const child of children) {
    const path = parentPath === '' ? String(index) : `${parentPath}.${index}`
    index += 1

    const node = buildNode(child, path, screenId, file, actions)
    if (node !== undefined) out.push(node)
  }
}

function buildNode(
  child: Rec,
  path: string,
  screenId: string,
  file: string,
  actions: Action[],
): ViewNode | undefined {
  const type = child['type']

  if (type === NODE_ELEMENT) return buildElement(child, path, screenId, file, actions)

  if (type === NODE_INTERPOLATION) {
    return {
      id: nodeId(screenId, path),
      primitive: 'text',
      source: sourceOf(file, child['loc']),
      coverage: { kind: 'generated' },
      bindings: [{ name: 'text', expression: expText(child['content']) ?? '' }],
      children: [],
    }
  }

  if (type === NODE_TEXT) {
    const content = typeof child['content'] === 'string' ? child['content'].trim() : ''
    if (content === '') return undefined

    return {
      id: nodeId(screenId, path),
      primitive: 'text',
      source: sourceOf(file, child['loc']),
      coverage: { kind: 'generated' },
      bindings: [{ name: 'text', expression: content }],
      children: [],
    }
  }

  return undefined
}

function buildElement(
  element: Rec,
  path: string,
  screenId: string,
  file: string,
  actions: Action[],
): ViewNode | undefined {
  const tag = typeof element['tag'] === 'string' ? element['tag'] : ''
  const primitive = PRIMITIVES[tag]
  if (primitive === undefined) return undefined

  const bindings: Binding[] = []

  for (const directive of directivesOf(element)) {
    const binding = directiveBinding(directive)
    if (binding !== undefined) bindings.push(binding)

    if (directive['name'] === 'on') {
      const event = argText(directive['arg']) ?? 'event'
      actions.push({
        id: `${screenId}/action/${actions.length}`,
        name: event,
        source: sourceOf(file, directive['loc']),
      })
    }
  }

  const children: ViewNode[] = []
  buildChildren(asRecs(element['children']), path, screenId, file, actions, children)

  return {
    id: nodeId(screenId, path),
    primitive,
    source: sourceOf(file, element['loc']),
    coverage: { kind: 'generated' },
    bindings,
    children,
  }
}

function buildScreen(descriptor: SFCDescriptor, screenId: string, file: string): BuiltScreen {
  const state = collectState(descriptor)
  const actions: Action[] = []
  const nodes: ViewNode[] = []
  const root = templateRoot(descriptor)

  if (root !== undefined) {
    buildChildren(asRecs(root['children']), '', screenId, file, actions, nodes)
  }

  return { nodes, state, actions }
}

function countNodes(nodes: readonly ViewNode[]): number {
  let total = 0

  for (const node of nodes) {
    total += 1 + countNodes(node.children)
  }

  return total
}

function unitFor(graph: AppGraph, screen: ScreenNode): UnitNode | undefined {
  return graph.units.find((unit) => unit.id === screen.unitId)
}

function baseName(file: string): string {
  const segment = file.split('/').at(-1) ?? file
  return segment.replace(/\.vue$/, '')
}

function readScreen(rootDir: string, file: string): ReadOk | ReadFail {
  let text: string

  try {
    text = readFileSync(join(rootDir, file), 'utf8')
  } catch (error) {
    return { ok: false, message: `could not be read: ${errorMessage(error)}` }
  }

  const { descriptor, errors } = parse(text, { filename: file })

  if (errors.length > 0) {
    return { ok: false, message: `could not be parsed: ${errorMessage(errors[0])}` }
  }

  return { ok: true, descriptor }
}

function screenSource(file: string, reading: ReadOk | ReadFail): SourceRef {
  if (!reading.ok) {
    return { adapterId: ADAPTER_ID, file }
  }

  const template = reading.descriptor.template
  const line = template === null ? 1 : (lineOf(asRec(template)) ?? 1)

  return { adapterId: ADAPTER_ID, file, line }
}

function lower(selection: LoweringSelection, snapshot: LoweringSnapshot): LoweringResult {
  const graph = snapshot.graph
  const screens: Screen[] = []
  const findings: LoweringFinding[] = []
  let generated = 0
  let refused = 0

  for (const graphScreen of graph.screens) {
    const unit = unitFor(graph, graphScreen)
    const file = unit?.source.file ?? graphScreen.source.file
    const reading = readScreen(selection.rootDir, file)
    const screenFindings = reading.ok
      ? collectRefusals(reading.descriptor, file)
      : [refusal('unreadable-screen', file, undefined, reading.message)]
    const failed = screenFindings.length > 0

    let nodes: readonly ViewNode[] = []
    let state: readonly StateModel[] = []
    let actions: readonly Action[] = []

    if (failed) {
      refused += 1
      findings.push(...screenFindings)
    } else if (reading.ok) {
      const built = buildScreen(reading.descriptor, graphScreen.id, file)
      nodes = built.nodes
      state = built.state
      actions = built.actions
      generated += countNodes(nodes)
    }

    screens.push({
      id: graphScreen.id,
      name: graphScreen.name ?? baseName(file),
      source: screenSource(file, reading),
      coverage: failed
        ? { kind: 'refused', reason: screenFindings.map((finding) => finding.code).join(', ') }
        : { kind: 'generated' },
      nodes: failed ? [] : nodes,
      state: failed ? [] : state,
      actions: failed ? [] : actions,
      layout: [],
      styles: [],
      resources: [],
    })
  }

  const workflow: Workflow = {
    schemaVersion: WORKFLOW_IR_SCHEMA_VERSION,
    id: `${ADAPTER_ID}:${screens.map((screen) => screen.id).join('|')}`,
    screens,
  }

  return {
    workflow,
    coverage: { generated, manualRequired: 0, excluded: 0, refused },
    findings,
  }
}

/** Creates the Vue lowering as a registered source transform provider. */
export function createVueLowering(): SourceTransformProvider {
  return {
    id: PROVIDER_ID,
    lower,
  }
}
