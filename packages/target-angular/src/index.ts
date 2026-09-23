import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse as parseHtml, NodeTypes } from '@vue/compiler-dom'
import type { ElementNode, TemplateChildNode } from '@vue/compiler-dom'

/**
 * The Angular target provider.
 *
 * It compiles an auditable subset of an Angular template to the Navirox native
 * primitives and reports every unsupported construct, so a component is either
 * compiled in full or refused with a finding. The template is tokenised as HTML
 * by `@vue/compiler-dom`'s parser, used only as a tokenizer; every Angular
 * interpretation (structural directives, bindings, events) is written here.
 */

export const PACKAGE_NAME = '@memolabs-apps/target-angular'

export const PACKAGE_ROLE =
  'The narrow Angular target provider: it compiles an auditable subset of Angular templates to Navirox native primitives and reports every unsupported construct.'

export const TARGET_VIEW_SCHEMA_VERSION = 1 as const

export const TARGET_PROVENANCE_SCHEMA_VERSION = 1 as const

export type NativePrimitive = 'view' | 'text' | 'pressable' | 'text-input' | 'scroll-view' | 'image'

export interface TargetFinding {
  readonly code:
    | 'template-parse-failed'
    | 'unsupported-element'
    | 'unsupported-directive'
    | 'unsupported-text'
    | 'unsupported-pipe'
    | 'unsupported-control-flow'
    | 'unsupported-interpolation'
  readonly message: string
  readonly line: number
  readonly column: number
}

export interface TargetViewNode {
  readonly primitive: NativePrimitive
  readonly sourceTag: string
  readonly line: number
  readonly column: number
  readonly children: readonly TargetViewNode[]
}

export interface AngularTargetReport {
  readonly schemaVersion: typeof TARGET_VIEW_SCHEMA_VERSION
  readonly nodes: readonly TargetViewNode[]
  readonly findings: readonly TargetFinding[]
}

export interface TargetProvenanceInput {
  readonly path: string
  readonly sha256: string
}

export interface TargetProvenanceManifest {
  readonly schemaVersion: typeof TARGET_PROVENANCE_SCHEMA_VERSION
  /** The view source the compiler consumed (template text, or the script when a class refusal never reached the template). */
  readonly input: TargetProvenanceInput
  /**
   * The class script compiled beside that template. The path matches `input`
   * when the template is inline in the component file; the hashes differ
   * because `input` hashes the template text and `component` hashes the script.
   */
  readonly component?: TargetProvenanceInput
  readonly outputPath?: string
  readonly compilerVersion: string
  readonly nodes: readonly TargetViewNode[]
  readonly findings: readonly TargetFinding[]
}

export interface AngularTargetOutput {
  readonly report: AngularTargetReport
  readonly manifest: TargetProvenanceManifest
  /** Native Vue SFC source when the template is fully in the supported subset. */
  readonly code?: string
}

const TAGS: Readonly<Record<string, NativePrimitive>> = {
  article: 'view',
  aside: 'view',
  div: 'view',
  dl: 'view',
  figure: 'view',
  footer: 'view',
  header: 'view',
  li: 'view',
  main: 'view',
  nav: 'view',
  ol: 'view',
  section: 'view',
  ul: 'view',
  abbr: 'text',
  b: 'text',
  blockquote: 'text',
  cite: 'text',
  code: 'text',
  dd: 'text',
  dt: 'text',
  em: 'text',
  figcaption: 'text',
  h1: 'text',
  h2: 'text',
  h3: 'text',
  h4: 'text',
  h5: 'text',
  h6: 'text',
  i: 'text',
  label: 'text',
  legend: 'text',
  mark: 'text',
  p: 'text',
  pre: 'text',
  q: 'text',
  s: 'text',
  small: 'text',
  span: 'text',
  strong: 'text',
  sub: 'text',
  summary: 'text',
  sup: 'text',
  time: 'text',
  u: 'text',
  button: 'pressable',
  img: 'image',
  input: 'text-input',
  textarea: 'text-input',
}

/**
 * Elements that group content without mapping to a native primitive.
 *
 * Angular's `ng-container` and Vue's `template` both carry directives and
 * children but render no element of their own, so their children take their
 * place and the directive is carried onto a `<template>` fragment.
 */
const TRANSPARENT_TAGS: ReadonlySet<string> = new Set(['ng-container', 'template'])

const HERE = dirname(fileURLToPath(import.meta.url))
const OWN_MANIFEST_PATH = join(HERE, '..', 'package.json')

function readCompilerVersion(): string {
  const manifest = JSON.parse(readFileSync(OWN_MANIFEST_PATH, 'utf8')) as {
    readonly version?: unknown
  }

  if (typeof manifest.version !== 'string' || manifest.version === '') {
    throw new Error(
      `The target-angular manifest at "${OWN_MANIFEST_PATH}" has no version, so compiled screens cannot record which compiler produced them.`,
    )
  }

  return manifest.version
}

function hashSource(source: string): string {
  return createHash('sha256').update(source, 'utf8').digest('hex')
}

/** Stable manifest serialisation: the same input always hashes alike. */
export function serializeProvenanceManifest(manifest: TargetProvenanceManifest): string {
  return `${JSON.stringify(manifest, undefined, 2)}\n`
}

export function hashProvenanceManifest(manifest: TargetProvenanceManifest): string {
  return hashSource(serializeProvenanceManifest(manifest))
}

function finding(
  code: TargetFinding['code'],
  message: string,
  node: { readonly loc: { readonly start: { readonly line: number; readonly column: number } } },
): TargetFinding {
  return { code, message, line: node.loc.start.line, column: node.loc.start.column }
}

function targetTag(element: ElementNode, findings?: TargetFinding[]): NativePrimitive | undefined {
  const primitive = TAGS[element.tag]

  if (primitive === undefined && findings !== undefined) {
    findings.push(
      finding('unsupported-element', `<${element.tag}> has no native primitive mapping.`, element),
    )
  }

  return primitive
}

/**
 * Translates one Angular attribute into the native template form, or refuses it.
 *
 * The accepted set is fixed: the structural directives `*ngIf` and `*ngFor`, the
 * event `(click)`, a property binding `[prop]`, and the two-way `[(ngModel)]` on
 * a text input. Everything else is refused rather than guessed.
 */
function translateAttribute(
  element: ElementNode,
  name: string,
  value: string | undefined,
  findings: TargetFinding[] | undefined,
): string | undefined {
  if (name === 'data-testid') return `testID="${value ?? ''}"`

  if (name === '*ngIf') return `v-if="${value ?? ''}"`

  if (name === '*ngFor') {
    const match = /^let\s+([\w$]+)\s+of\s+(.+)$/.exec(value ?? '')

    if (match === null) {
      findings?.push(
        finding(
          'unsupported-directive',
          `The *ngFor expression "${value ?? ''}" is not "let item of items".`,
          element,
        ),
      )
      return undefined
    }

    return `v-for="${match[1]} in ${match[2]}"`
  }

  if (name.startsWith('[(') && name.endsWith(')]')) {
    const inner = name.slice(2, -2)

    if (inner === 'ngModel' && TAGS[element.tag] === 'text-input') return `v-model="${value ?? ''}"`

    findings?.push(
      finding('unsupported-directive', `${name} is not a native two-way binding.`, element),
    )
    return undefined
  }

  if (name.startsWith('(') && name.endsWith(')')) {
    const event = name.slice(1, -1)

    // A text input reports its value through the native value event, not a
    // press: a press carries no value, so a handler that reads one would bind
    // `undefined`. Angular's `(click)`, `(change)` and `(input)` on an input
    // all mean "the field was edited", which is what `@value-change` delivers.
    if (
      TAGS[element.tag] === 'text-input' &&
      (event === 'click' || event === 'press' || event === 'change' || event === 'input')
    ) {
      return `@value-change="${value ?? ''}"`
    }

    if (event === 'click' || event === 'press') return `@press="${value ?? ''}"`

    findings?.push(
      finding('unsupported-directive', `The event "${name}" has no native equivalent.`, element),
    )
    return undefined
  }

  if (name.startsWith('[') && name.endsWith(']')) {
    const prop = name.slice(1, -1)

    if (prop.startsWith('ng')) {
      findings?.push(
        finding(
          'unsupported-directive',
          `The Angular binding "${name}" has no native equivalent.`,
          element,
        ),
      )
      return undefined
    }

    // `[class.x]` and `[style.x]` pick one key of the class/style binding. Vue has
    // no dotted form, so they become the object form it does have.
    if (prop.startsWith('class.') || prop.startsWith('style.')) {
      const [prefix = '', ...rest] = prop.split('.')
      const key = rest.join('.')

      if (value === undefined || key === '' || (prefix === 'style' && rest.length > 1)) {
        findings?.push(
          finding(
            'unsupported-directive',
            `The Angular binding "${name}" has no native equivalent.`,
            element,
          ),
        )
        return undefined
      }

      const target = prefix === 'class' ? 'class' : 'style'

      return `:${target}="{ '${key}': ${value} }"`
    }

    if (prop.startsWith('attr.')) {
      const attribute = prop.slice('attr.'.length)

      if (value === undefined || attribute === '') {
        findings?.push(
          finding(
            'unsupported-directive',
            `The Angular binding "${name}" has no native equivalent.`,
            element,
          ),
        )
        return undefined
      }

      return `:${attribute}="${value}"`
    }

    return `:${prop}="${value ?? ''}"`
  }

  if (name.startsWith('*')) {
    findings?.push(
      finding('unsupported-directive', `${name} is not a native template directive.`, element),
    )
    return undefined
  }

  // Vue 3 does not interpolate a plain attribute, so an Angular attribute that
  // carries `{{ }}` would arrive as literal text. It is refused rather than
  // emitted as a screen that shows the braces.
  if (value !== undefined && value.includes('{{')) {
    findings?.push(
      finding(
        'unsupported-interpolation',
        `${name} interpolates inside its attribute, which a native template does not support. Use a binding instead.`,
        element,
      ),
    )
    return undefined
  }

  return value === undefined ? name : `${name}="${value}"`
}

function properties(element: ElementNode, findings?: TargetFinding[]): string {
  return element.props
    .map((property) => {
      if (property.type === NodeTypes.ATTRIBUTE) {
        return translateAttribute(element, property.name, property.value?.content, findings)
      }

      // The block rewriter emits these native directives, so they pass through.
      if (
        property.name === 'bind' ||
        property.name === 'if' ||
        property.name === 'else-if' ||
        property.name === 'else' ||
        property.name === 'for'
      ) {
        return property.loc.source
      }

      // Any other Vue-only directive has no place in an Angular template.
      if (findings !== undefined) {
        findings.push(
          finding(
            'unsupported-directive',
            `${property.rawName ?? property.name} is not an Angular template construct.`,
            property,
          ),
        )
      }

      return undefined
    })
    .map((property) => (property === undefined ? '' : ` ${property}`))
    .join('')
}

function bareText(node: TemplateChildNode): boolean {
  if (node.type === NodeTypes.INTERPOLATION) return true

  return node.type === NodeTypes.TEXT && node.content.trim().length > 0
}

function readNodes(
  nodes: readonly TemplateChildNode[],
  findings: TargetFinding[],
): TargetViewNode[] {
  const result: TargetViewNode[] = []

  for (const node of nodes) {
    if (node.type !== NodeTypes.ELEMENT) continue

    // A grouping element renders nothing, so its children stand in for it.
    if (TRANSPARENT_TAGS.has(node.tag)) {
      result.push(...readNodes(node.children, findings))
      properties(node, findings)
      continue
    }

    const primitive = targetTag(node, findings)

    if (primitive === undefined) continue

    if (primitive !== 'text') {
      const bare = node.children.find((child) => bareText(child))

      if (bare !== undefined) {
        findings.push(
          finding(
            'unsupported-text',
            `Text directly inside <${node.tag}> is not rendered natively. Wrap it in a text element such as <span>.`,
            bare,
          ),
        )
      }
    }

    result.push({
      primitive,
      sourceTag: node.tag,
      line: node.loc.start.line,
      column: node.loc.start.column,
      children: readNodes(node.children, findings),
    })
    properties(node, findings)
  }

  return result
}

function renderNodes(nodes: readonly TemplateChildNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION) {
        return node.loc.source
      }

      if (node.type !== NodeTypes.ELEMENT) return node.loc.source

      // A grouping element becomes a native `<template>` fragment, which renders
      // nothing and carries the directive to its children.
      if (TRANSPARENT_TAGS.has(node.tag)) {
        return `<template${properties(node)}>${renderNodes(node.children)}</template>`
      }

      const primitive = targetTag(node)

      if (primitive === undefined) return ''

      return `<${primitive}${properties(node)}>${renderNodes(node.children)}</${primitive}>`
    })
    .join('')
}

/** A single `|`, the Angular pipe operator, and not the `||` logical operator. */
function hasPipe(expression: string): boolean {
  return /(^|[^|])\|([^|]|$)/.test(expression)
}

const CONTROL_FLOW = /@(switch|case|default|defer|let|placeholder|loading|error|empty)\b/g

function findingAt(
  code: TargetFinding['code'],
  message: string,
  source: string,
  index: number,
): TargetFinding {
  const before = source.slice(0, index)

  return {
    code,
    message,
    line: before.split('\n').length,
    column: index - before.lastIndexOf('\n'),
  }
}

/**
 * The constructs Angular's expression and block syntax add over HTML.
 *
 * Neither is HTML: a pipe lives inside `{{ }}`, and a control-flow block starts
 * with `@`. Left alone they reach the HTML parser as text and a screen is
 * generated around them, so each is refused with a finding instead.
 */
function scanAngularSyntax(source: string, findings: TargetFinding[]): void {
  for (const match of source.matchAll(/\{\{([\s\S]*?)\}\}/g)) {
    const expression = match[1] ?? ''

    if (hasPipe(expression)) {
      findings.push(
        findingAt(
          'unsupported-pipe',
          `The expression "{{${expression}}}" uses a pipe, which has no native equivalent.`,
          source,
          match.index ?? 0,
        ),
      )
    }
  }

  for (const match of source.matchAll(CONTROL_FLOW)) {
    findings.push(
      findingAt(
        'unsupported-control-flow',
        `The control-flow block "@${match[1]}" has no native equivalent yet.`,
        source,
        match.index ?? 0,
      ),
    )
  }
}

/** The `}` that closes the block opened at `open`, or -1 when it never closes. */
function matchingBrace(source: string, open: number): number {
  let depth = 1

  for (let index = open + 1; index < source.length; index += 1) {
    const char = source[index]

    if (char === "'" || char === '"' || char === '`') {
      index += 1

      while (index < source.length && source[index] !== char) {
        if (source[index] === '\\') index += 1
        index += 1
      }

      continue
    }

    if (char === '{') depth += 1
    else if (char === '}') {
      depth -= 1
      if (depth === 0) return index
    }
  }

  return -1
}

/** Angular wraps a block condition in parentheses; the native directive does not. */
function unwrap(condition: string): string {
  return condition.startsWith('(') && condition.endsWith(')')
    ? condition.slice(1, -1).trim()
    : condition
}

/** The native opening tag a control-flow header becomes, or undefined when refused. */
function blockHead(
  keyword: string,
  condition: string,
  source: string,
  at: number,
  findings: TargetFinding[],
): string | undefined {
  if (keyword === 'if') return `<template v-if="${unwrap(condition)}">`
  if (keyword === 'else if') return `<template v-else-if="${unwrap(condition)}">`
  if (keyword === 'else') return '<template v-else>'

  if (keyword === 'for') {
    const match = /^\(([\w$]+)\s+of\s+(.+?)(?:;\s*track\s+(.+))?\)$/.exec(condition)

    if (match === null) {
      findings.push(
        findingAt(
          'unsupported-control-flow',
          `The @for expression "${condition}" is not "item of items; track key".`,
          source,
          at,
        ),
      )
      return undefined
    }

    const [, item, items, track] = match

    return track === undefined
      ? `<template v-for="${item} in ${items}">`
      : `<template v-for="${item} in ${items}" :key="${track}">`
  }

  findings.push(
    findingAt(
      'unsupported-control-flow',
      `The "@${keyword}" block has no native equivalent yet.`,
      source,
      at,
    ),
  )

  return undefined
}

/**
 * Rewrites Angular's block syntax into the native directives.
 *
 * `@if`/`@else if`/`@else` and `@for` are not HTML, so they become
 * `<template v-if>` and friends before the parser runs. An `@empty` block and a
 * malformed header are refused rather than guessed.
 */
function rewriteAngularBlocks(source: string, findings: TargetFinding[]): string {
  let output = ''
  let index = 0

  while (index < source.length) {
    if (source[index] !== '@') {
      output += source[index]
      index += 1
      continue
    }

    const header = /^@(else if|if|else|for|empty)\b/.exec(source.slice(index))

    if (header === null) {
      output += source[index]
      index += 1
      continue
    }

    const keyword = header[1] ?? ''
    const open = source.indexOf('{', index)

    if (open === -1) {
      findings.push(
        findingAt(
          'unsupported-control-flow',
          `The "@${keyword}" block never opens.`,
          source,
          index,
        ),
      )
      output += source.slice(index)
      break
    }

    const close = matchingBrace(source, open)

    if (close === -1) {
      findings.push(
        findingAt(
          'unsupported-control-flow',
          `The "@${keyword}" block never closes.`,
          source,
          index,
        ),
      )
      output += source.slice(index)
      break
    }

    const condition = source.slice(index + header[0].length, open).trim()
    const head = blockHead(keyword, condition, source, index, findings)

    if (head === undefined) {
      output += source.slice(index)
      break
    }

    output += head
    output += rewriteAngularBlocks(source.slice(open + 1, close), findings)
    output += '</template>'
    index = close + 1

    // `v-else` must follow its `v-if` immediately, so whitespace before an
    // `@else` is dropped rather than left between the two fragments.
    const gap = /^\s*(?=@else\b)/.exec(source.slice(index))

    if (gap !== null) index += gap[0].length
  }

  return output
}

/**
 * Compile one Angular template through the target-provider seam.
 *
 * Pass the intended generated file path as outputPath so the manifest names it;
 * the manifest omits the path whenever findings exist.
 */
export function compileAngularTarget(
  source: string,
  filename = 'Component.html',
  outputPath?: string,
): AngularTargetOutput {
  const compilerVersion = readCompilerVersion()
  const input: TargetProvenanceInput = { path: filename, sha256: hashSource(source) }
  const findings: TargetFinding[] = []

  // Angular's block and pipe syntax is not HTML, so it is refused before the
  // parser can read it as text and generate a screen that shows the syntax.
  scanAngularSyntax(source, findings)

  // The blocks this target does implement are rewritten to native directives.
  const rewritten = rewriteAngularBlocks(source, findings)

  let parsed
  try {
    parsed = parseHtml(rewritten, {
      onError: (error) => {
        findings.push({
          code: 'template-parse-failed',
          message: error.message,
          line: error.loc?.start.line ?? 1,
          column: error.loc?.start.column ?? 1,
        })
      },
    })
  } catch (error) {
    findings.push({
      code: 'template-parse-failed',
      message: error instanceof Error ? error.message : String(error),
      line: 1,
      column: 1,
    })
    const report: AngularTargetReport = {
      schemaVersion: TARGET_VIEW_SCHEMA_VERSION,
      nodes: [],
      findings,
    }

    return {
      report,
      manifest: {
        schemaVersion: TARGET_PROVENANCE_SCHEMA_VERSION,
        input,
        compilerVersion,
        nodes: report.nodes,
        findings,
      },
    }
  }

  const nodes = readNodes(parsed.children, findings)
  const report: AngularTargetReport = { schemaVersion: TARGET_VIEW_SCHEMA_VERSION, nodes, findings }

  if (findings.length > 0) {
    return {
      report,
      manifest: {
        schemaVersion: TARGET_PROVENANCE_SCHEMA_VERSION,
        input,
        compilerVersion,
        nodes,
        findings,
      },
    }
  }

  return {
    report,
    manifest: {
      schemaVersion: TARGET_PROVENANCE_SCHEMA_VERSION,
      input,
      ...(outputPath === undefined ? {} : { outputPath }),
      compilerVersion,
      nodes,
      findings,
    },
    code: `<template>${renderNodes(parsed.children)}</template>\n`,
  }
}

/** A whole Angular component: its template and the class that backs it. */
export interface AngularComponentInput {
  readonly template: string
  readonly script: string
  readonly filename?: string
  readonly outputPath?: string
  /** Sources for injectable classes, keyed by the `Type` in `inject(Type)`. */
  readonly injectables?: Readonly<Record<string, string>>
}

/**
 * The class constructs the translator refuses outright.
 *
 * A component using any of these needs behaviour the runtime cannot be given
 * from a bounded translation, so the whole component is refused rather than
 * emitted with a piece missing.
 */
const CLASS_UNSUPPORTED: readonly { readonly pattern: RegExp; readonly what: string }[] = [
  { pattern: /\bconstructor\s*\(/, what: 'a constructor' },
  { pattern: /(?:^|\n)\s*@(?!Component\b)([A-Za-z_$][\w$]*)\s*\(/, what: 'a decorator' },
  { pattern: /\bimplements\b/, what: 'an implements clause' },
  { pattern: /\bngOn[A-Za-z]+\b/, what: 'a lifecycle hook' },
  { pattern: /\binject\s*\(/, what: 'dependency injection' },
  { pattern: /\b(?:get|set)\s+[A-Za-z_$][\w$]*\s*\(/, what: 'a getter or setter' },
]

/**
 * The one inject form this target translates: `name = inject(Type)`.
 *
 * Any other `inject(...)` still hits `CLASS_UNSUPPORTED` after these field
 * declarations are blanked out, so the refusal rule stays in force for
 * constructor-style, optioned, and bare `inject` calls.
 */
const BOUNDED_INJECT_FIELD =
  /^[ \t]*(?:readonly[ \t]+)?([A-Za-z_$][\w$]*)[ \t]*(?::[^=\n]+)?=[ \t]*inject[ \t]*\([ \t]*([A-Za-z_$][\w$]*)[ \t]*\)[ \t]*;?/gm

const FIELD = /^\s*(?:readonly\s+)?([A-Za-z_$][\w$]*)\s*(?::[^=;\n]+)?=\s*([^\n;]+);?\s*$/gm

const METHOD =
  /(?:^|\n)\s*(?:(?:public|private|protected|static)\s+)*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\(([^()]*)\)\s*(?::[^\{;]+)?\{/g

interface BoundedInjectField {
  readonly name: string
  readonly type: string
  readonly index: number
}

interface TranslatedInject {
  readonly name: string
  readonly properties: readonly string[]
  readonly signals: readonly string[]
}

interface ComponentState {
  readonly setup: readonly string[]
  readonly signals: readonly string[]
}

/** The body of the component class, without its braces. */
function classBody(script: string): string | undefined {
  const head = /\bclass\s+[A-Za-z_$][\w$]*[\s\S]*?\{/.exec(script)

  if (head === null) return undefined

  const open = script.indexOf('{', head.index)
  const close = open === -1 ? -1 : matchingBrace(script, open)

  return close === -1 ? undefined : script.slice(open + 1, close)
}

/** Inside a translated body, `this.x` reads the ref `x`. */
function asRef(member: string): string {
  return member.replace(/\bthis\.([A-Za-z_$][\w$]*)/g, '$1.value')
}

/**
 * Rewrites an Angular input value read to the native value event payload.
 *
 * Angular reads a field's value off the DOM, `(event.target as
 * HTMLInputElement).value`. The native `text-input` reports it as `text` on the
 * value event, so a handler that still read the DOM would bind `undefined`.
 */
function rewriteValueRead(body: string): string {
  return body
    .replaceAll('(event.target as HTMLInputElement).value', 'event.text')
    .replaceAll('event.target.value', 'event.text')
}

function refusal(what: string, at: number, source: string): TargetFinding {
  return findingAt(
    'unsupported-directive',
    `The Angular target does not translate ${what} yet, so this component is refused rather than emitted incomplete.`,
    source,
    at,
  )
}

function stateFor(body: string): ComponentState | undefined {
  const setup: string[] = []
  const signals: string[] = []

  for (const match of body.matchAll(FIELD)) {
    const name = match[1] ?? ''
    const initial = (match[2] ?? '').trim()

    if (name === '' || initial === '') continue

    const signal = /^signal\s*(?:<[^>]*>)?\s*\(([\s\S]*)\)$/.exec(initial)

    if (signal !== null) {
      setup.push(`const ${name} = ref(${(signal[1] ?? 'undefined').trim()})`)
      signals.push(name)
      continue
    }

    const computed = /^computed\s*\(([\s\S]*)\)$/.exec(initial)

    if (computed !== null) {
      setup.push(`const ${name} = computed(${asRef((computed[1] ?? '').trim())})`)
      continue
    }

    setup.push(`const ${name} = ref(${initial})`)
  }

  for (const match of body.matchAll(METHOD)) {
    const name = match[1] ?? ''
    const open = (match.index ?? 0) + match[0].length - 1
    const close = matchingBrace(body, open)

    if (name === '' || close === -1) continue

    setup.push(
      `function ${name}(${(match[2] ?? '').trim()}) {\n  ${rewriteValueRead(asRef(body.slice(open + 1, close).trim()))}\n}`,
    )
  }

  return setup.length === 0 ? undefined : { setup, signals }
}

/** The `)` that closes the `(` at `open`, or -1 when it never closes. */
function matchingParen(source: string, open: number): number {
  let depth = 1

  for (let index = open + 1; index < source.length; index += 1) {
    const char = source[index]

    if (char === "'" || char === '"' || char === '`') {
      index += 1

      while (index < source.length && source[index] !== char) {
        if (source[index] === '\\') index += 1
        index += 1
      }

      continue
    }

    if (char === '(') depth += 1
    else if (char === ')') {
      depth -= 1
      if (depth === 0) return index
    }
  }

  return -1
}

/**
 * Rewrites one Angular service method body for a `reactive` nest.
 *
 * Nested refs unwrap, so `this.signal.set(v)` becomes an assignment,
 * `this.signal.update(fn)` applies `fn` to the current value, and a no-arg
 * `this.signal()` read drops the call. Top-level component bodies keep `asRef`
 * instead; this path is only for members emitted inside `reactive({ ... })`.
 */
function rewriteReactiveBody(body: string): string {
  let output = ''
  let index = 0

  while (index < body.length) {
    const rest = body.slice(index)
    const setter = /^this\.([A-Za-z_$][\w$]*)\.(set|update)\(/.exec(rest)

    if (setter !== null) {
      const name = setter[1] ?? ''
      const operation = setter[2] ?? 'set'
      const open = index + setter[0].length - 1
      const close = matchingParen(body, open)

      if (close !== -1) {
        const argument = rewriteReactiveBody(body.slice(open + 1, close))
        output +=
          operation === 'set'
            ? `this.${name} = ${argument}`
            : `this.${name} = (${argument})(this.${name})`
        index = close + 1
        continue
      }
    }

    const call = /^this\.([A-Za-z_$][\w$]*)\(\)/.exec(rest)

    if (call !== null) {
      output += `this.${call[1]}`
      index += call[0].length
      continue
    }

    output += body[index] ?? ''
    index += 1
  }

  return output
}

/** The injectable's state as `reactive` properties, or undefined when empty. */
function reactiveStateFor(body: string): { properties: string[]; signals: string[] } | undefined {
  const properties: string[] = []
  const signals: string[] = []

  for (const match of body.matchAll(FIELD)) {
    const name = match[1] ?? ''
    const initial = (match[2] ?? '').trim()

    if (name === '' || initial === '') continue

    const signal = /^signal\s*(?:<[^>]*>)?\s*\(([\s\S]*)\)$/.exec(initial)

    if (signal !== null) {
      properties.push(`${name}: ref(${(signal[1] ?? 'undefined').trim()})`)
      signals.push(name)
      continue
    }

    const computed = /^computed\s*\(([\s\S]*)\)$/.exec(initial)

    if (computed !== null) {
      properties.push(`${name}: computed(${rewriteReactiveBody((computed[1] ?? '').trim())})`)
      continue
    }

    properties.push(`${name}: ref(${initial})`)
  }

  for (const match of body.matchAll(METHOD)) {
    const name = match[1] ?? ''
    const open = (match.index ?? 0) + match[0].length - 1
    const close = matchingBrace(body, open)

    if (name === '' || close === -1) continue

    const methodBody = rewriteReactiveBody(body.slice(open + 1, close).trim())
    properties.push(`${name}(${(match[2] ?? '').trim()}) {\n  ${methodBody}\n}`)
  }

  return properties.length === 0 ? undefined : { properties, signals }
}

/** Drops `@Injectable(...)` so the decorator rule does not refuse the service. */
function stripInjectableDecorator(source: string): string {
  return source.replace(/(?:^|\n)[ \t]*@Injectable\s*\([^)]*\)/g, '')
}

/** Blanks bounded inject fields so leftover `inject(` still hits CLASS_UNSUPPORTED. */
function blankBoundedInjects(script: string): {
  readonly blanked: string
  readonly fields: BoundedInjectField[]
} {
  const fields: BoundedInjectField[] = []
  const blanked = script.replace(
    BOUNDED_INJECT_FIELD,
    (match, name: string, type: string, offset: number) => {
      fields.push({ name, type, index: offset })
      return ' '.repeat(match.length)
    },
  )

  return { blanked, fields }
}

/** Rewrites `this.injectName...` before top-level `asRef` runs on component methods. */
function rewriteInjectRefs(body: string, injects: readonly TranslatedInject[]): string {
  let result = body

  for (const inject of injects) {
    for (const signal of inject.signals) {
      result = result.replaceAll(`this.${inject.name}.${signal}()`, `${inject.name}.${signal}`)
    }
  }

  for (const inject of injects) {
    result = result.replaceAll(`this.${inject.name}`, inject.name)
  }

  return result
}

function translateInjectables(
  fields: readonly BoundedInjectField[],
  injectables: Readonly<Record<string, string>> | undefined,
  script: string,
): { readonly translated: TranslatedInject[]; readonly findings: TargetFinding[] } {
  const translated: TranslatedInject[] = []
  const findings: TargetFinding[] = []

  for (const field of fields) {
    const source = injectables?.[field.type]

    if (source === undefined) {
      findings.push(refusal(`an injectable source for ${field.type}`, field.index, script))
      continue
    }

    const cleaned = stripInjectableDecorator(source)
    let blocked = false

    for (const rule of CLASS_UNSUPPORTED) {
      const match = rule.pattern.exec(cleaned)

      if (match !== null) {
        findings.push(refusal(rule.what, match.index, cleaned))
        blocked = true
        break
      }
    }

    if (blocked) continue

    const body = classBody(cleaned)

    if (body === undefined) {
      findings.push(refusal(`the class body of ${field.type}`, field.index, script))
      continue
    }

    const state = reactiveStateFor(body)

    if (state === undefined) {
      findings.push(refusal(`translatable state on ${field.type}`, field.index, script))
      continue
    }

    translated.push({ name: field.name, ...state })
  }

  return { translated, findings }
}

/** A component output that carries the findings and no source. */
function refusedComponent(
  filename: string,
  script: string,
  findings: readonly TargetFinding[],
): AngularTargetOutput {
  const component: TargetProvenanceInput = { path: filename, sha256: hashSource(script) }

  return {
    report: { schemaVersion: TARGET_VIEW_SCHEMA_VERSION, nodes: [], findings },
    manifest: {
      schemaVersion: TARGET_PROVENANCE_SCHEMA_VERSION,
      input: component,
      component,
      compilerVersion: readCompilerVersion(),
      nodes: [],
      findings,
    },
  }
}

interface SourceImport {
  readonly local: string
  readonly imported: string
  readonly typeOnly: boolean
  readonly module: string
}

/** Named value and type imports a source declares, with the module they come from. */
function collectNamedImports(source: string): SourceImport[] {
  const results: SourceImport[] = []
  const pattern = /import\s+(type\s+)?\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g

  for (const match of source.matchAll(pattern)) {
    const wholeType = match[1] !== undefined
    const clause = match[2] ?? ''
    const module = match[3] ?? ''

    for (const part of clause.split(',')) {
      const piece = part.trim()

      if (piece === '') continue

      const typeOnly = wholeType || /^type\s+/.test(piece)
      const cleaned = piece.replace(/^type\s+/, '').trim()
      const aliased = /^([A-Za-z_$][\w$]*)\s+as\s+([A-Za-z_$][\w$]*)$/.exec(cleaned)

      if (aliased !== null) {
        results.push({
          local: aliased[2] ?? '',
          imported: aliased[1] ?? '',
          typeOnly,
          module,
        })
      } else if (/^[A-Za-z_$][\w$]*$/.test(cleaned)) {
        results.push({ local: cleaned, imported: cleaned, typeOnly, module })
      }
    }
  }

  return results
}

function identifierIn(text: string, name: string): boolean {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  return new RegExp(`(?<![\\w$])${escaped}(?![\\w$])`).test(text)
}

/**
 * Re-emit the library imports the translated setup still references.
 *
 * Method bodies and inject initialisers keep free identifiers from the source
 * (`nextIn`, seed data, helper types). Dropping those imports would emit a
 * screen that fails at runtime, so each named import whose local binding
 * appears in the setup is rewritten with its original module specifier.
 * Angular packages are never re-emitted: a name from `@angular/*` that survives
 * translation is a bug, not an import the native screen should carry.
 */
function freeIdentifierImports(setup: string, sources: readonly string[]): string[] {
  const declared = new Set<string>()

  for (const match of setup.matchAll(/\b(?:const|function|let|var)\s+([A-Za-z_$][\w$]*)/g)) {
    if (match[1] !== undefined) declared.add(match[1])
  }

  const byModule = new Map<string, SourceImport[]>()
  const seen = new Set<string>()

  for (const source of sources) {
    for (const entry of collectNamedImports(source)) {
      if (entry.module === 'vue' || entry.module.startsWith('@angular/')) continue
      if (entry.local === '' || declared.has(entry.local)) continue
      if (!identifierIn(setup, entry.local)) continue

      const key = `${entry.module} ${entry.local}`

      if (seen.has(key)) continue
      seen.add(key)

      const bucket = byModule.get(entry.module) ?? []

      bucket.push(entry)
      byModule.set(entry.module, bucket)
    }
  }

  return [...byModule].map(([module, entries]) => {
    const parts = entries.map((entry) => {
      if (entry.imported !== entry.local) {
        return `${entry.typeOnly ? 'type ' : ''}${entry.imported} as ${entry.local}`
      }

      return entry.typeOnly ? `type ${entry.local}` : entry.local
    })

    return `import { ${parts.join(', ')} } from '${module}'`
  })
}

/**
 * Compile a whole Angular component: its template and the class state behind it.
 *
 * The class goes through a small, closed set (literal fields, `signal(...)`,
 * `computed(...)`, simple methods, and a bounded `name = inject(Type)` whose
 * injectable source the caller supplies). A component whose class uses anything
 * else is refused with a finding and no source, because a screen that binds to a
 * value it never declares is not a screen that runs.
 */
export function compileAngularComponent(input: AngularComponentInput): AngularTargetOutput {
  const filename = input.filename ?? 'Component.html'
  const findings: TargetFinding[] = []
  const { blanked, fields: injectFields } = blankBoundedInjects(input.script)

  for (const rule of CLASS_UNSUPPORTED) {
    const match = rule.pattern.exec(blanked)

    if (match !== null) findings.push(refusal(rule.what, match.index, blanked))
  }

  if (findings.length > 0) {
    return refusedComponent(filename, input.script, findings)
  }

  const { translated, findings: injectFindings } = translateInjectables(
    injectFields,
    input.injectables,
    input.script,
  )
  findings.push(...injectFindings)

  if (findings.length > 0) {
    return refusedComponent(filename, input.script, findings)
  }

  const body = classBody(blanked)

  if (body === undefined) {
    findings.push(refusal('a component class', 0, input.script))
    return refusedComponent(filename, input.script, findings)
  }

  const state = stateFor(rewriteInjectRefs(body, translated))

  if (state === undefined && translated.length === 0) {
    findings.push(refusal('a component with no translatable state', 0, input.script))
    return refusedComponent(filename, input.script, findings)
  }

  // Angular calls a signal in the template; Vue reads it plainly, so `name()`
  // becomes `name` before the template is compiled. The inject target uses the
  // same rule for each of its signal members under the inject field name.
  let template =
    state?.signals.reduce(
      (text, name) => text.replace(new RegExp(`\\b${name}\\(\\)`, 'g'), name),
      input.template,
    ) ?? input.template

  for (const inject of translated) {
    for (const signal of inject.signals) {
      template = template.replace(
        new RegExp(`\\b${inject.name}\\.${signal}\\(\\)`, 'g'),
        `${inject.name}.${signal}`,
      )
    }
  }

  const compiled = compileAngularTarget(template, filename, input.outputPath)

  if (compiled.code === undefined) {
    return refusedComponent(filename, input.script, [...findings, ...compiled.report.findings])
  }

  const injectSetup = translated.map((inject) => {
    const lines = inject.properties.map((property) => `  ${property}`).join(',\n')
    return `const ${inject.name} = reactive({\n${lines}\n})`
  })
  const setup = [...(state?.setup ?? []), ...injectSetup]
  const setupText = setup.join('\n')
  const vueNames: string[] = []

  if (/\bcomputed\s*\(/.test(setupText)) vueNames.push('computed')
  if (/\breactive\s*\(/.test(setupText)) vueNames.push('reactive')
  if (/\bref\s*\(/.test(setupText)) vueNames.push('ref')

  const scriptLines: string[] = []

  if (vueNames.length > 0) {
    scriptLines.push(`import { ${vueNames.join(', ')} } from 'vue'`)
  }

  scriptLines.push(
    ...freeIdentifierImports(setupText, [input.script, ...Object.values(input.injectables ?? {})]),
  )
  scriptLines.push(setupText)

  return {
    report: compiled.report,
    manifest: {
      ...compiled.manifest,
      component: { path: filename, sha256: hashSource(input.script) },
    },
    code: `<script setup lang="ts">\n${scriptLines.join('\n')}\n</script>\n${compiled.code}`,
  }
}
