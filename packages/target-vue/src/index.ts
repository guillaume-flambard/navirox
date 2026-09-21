import { parse as parseTemplate, NodeTypes } from '@vue/compiler-dom'
import { parse as parseSfc } from '@vue/compiler-sfc'
import type { ElementNode, TemplateChildNode } from '@vue/compiler-dom'

export const PACKAGE_NAME = '@memolabs-apps/target-vue'

export const PACKAGE_ROLE =
  'The narrow Vue target provider: it compiles an auditable subset of Vue SFC templates to Navirox native primitives and reports every unsupported construct.'

export const TARGET_VIEW_SCHEMA_VERSION = 1 as const

export type NativePrimitive = 'view' | 'text' | 'pressable' | 'text-input' | 'scroll-view' | 'image'

export interface TargetFinding {
  readonly code:
    'template-parse-failed' | 'unsupported-element' | 'unsupported-directive' | 'unsupported-style'
  readonly message: string
  readonly line: number
  readonly column: number
}

export interface TargetViewNode {
  readonly primitive: NativePrimitive
  readonly sourceTag: string
  readonly line: number
  readonly children: readonly TargetViewNode[]
}

export interface VueTargetReport {
  readonly schemaVersion: typeof TARGET_VIEW_SCHEMA_VERSION
  readonly nodes: readonly TargetViewNode[]
  readonly findings: readonly TargetFinding[]
}

export interface VueTargetOutput {
  readonly report: VueTargetReport
  /**
   * Native Vue SFC source when the template is fully in the supported subset.
   * Undefined is intentional: emitting a plausible but incomplete screen would
   * make an unsupported web construct look migrated.
   */
  readonly code?: string
}

const TAGS: Readonly<Record<string, NativePrimitive>> = {
  article: 'view',
  div: 'view',
  footer: 'view',
  header: 'view',
  li: 'view',
  main: 'view',
  nav: 'view',
  section: 'view',
  ul: 'view',
  h1: 'text',
  h2: 'text',
  h3: 'text',
  h4: 'text',
  h5: 'text',
  h6: 'text',
  label: 'text',
  p: 'text',
  span: 'text',
  strong: 'text',
  em: 'text',
  button: 'pressable',
  img: 'image',
  input: 'text-input',
  textarea: 'text-input',
}

/** CSS properties already demonstrated by the native acceptance application. */
const NATIVE_STYLE_PROPERTIES = new Set([
  'align-items',
  'background-color',
  'border-color',
  'border-radius',
  'border-width',
  'color',
  'flex',
  'flex-direction',
  'font-size',
  'font-weight',
  'height',
  'justify-content',
  'letter-spacing',
  'line-height',
  'margin',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'margin-top',
  'max-height',
  'max-width',
  'min-height',
  'min-width',
  'opacity',
  'padding',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'padding-top',
  'width',
])

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

function properties(element: ElementNode, findings?: TargetFinding[]): string {
  return element.props
    .map((property) => {
      const source = property.loc.source
      if (property.type === NodeTypes.DIRECTIVE) {
        if (property.name === 'on' && property.arg?.type === NodeTypes.SIMPLE_EXPRESSION) {
          if (property.arg.content === 'click') return source.replace(/^@click\b/, '@press')
          if (property.arg.content === 'press') return source
        }
        if (
          property.name === 'bind' ||
          property.name === 'if' ||
          property.name === 'else-if' ||
          property.name === 'else' ||
          property.name === 'for'
        )
          return source
        if (findings !== undefined) {
          findings.push(
            finding(
              'unsupported-directive',
              `${property.rawName ?? `v-${property.name}`} is not a native template directive.`,
              property,
            ),
          )
        }
      }
      return source
    })
    .map((property) => ` ${property}`)
    .join('')
}

function readNodes(
  nodes: readonly TemplateChildNode[],
  findings: TargetFinding[],
): TargetViewNode[] {
  const result: TargetViewNode[] = []
  for (const node of nodes) {
    if (node.type !== NodeTypes.ELEMENT) continue
    const primitive = targetTag(node, findings)
    if (primitive === undefined) continue
    result.push({
      primitive,
      sourceTag: node.tag,
      line: node.loc.start.line,
      children: readNodes(node.children, findings),
    })
    properties(node, findings)
  }
  return result
}

function renderNodes(nodes: readonly TemplateChildNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION)
        return node.loc.source
      if (node.type !== NodeTypes.ELEMENT) return node.loc.source

      const primitive = targetTag(node)
      if (primitive === undefined) return ''
      const props = properties(node)
      const children = renderNodes(node.children)
      return `<${primitive}${props}>${children}</${primitive}>`
    })
    .join('')
}

/**
 * The native CSS compiler owns values and class registration. This check owns
 * the target-provider decision: only simple class rules that do not rely on a
 * browser behaviour reach that compiler.
 */
function validateStyle(
  cssSource: string,
  block: { readonly loc: { readonly start: { readonly line: number; readonly column: number } } },
): TargetFinding[] {
  const findings: TargetFinding[] = []
  const css = cssSource.replaceAll(/\/\*[\s\S]*?\*\//g, '')
  if (/@[a-z-]+/i.test(css)) {
    findings.push(
      finding(
        'unsupported-style',
        'CSS at-rules need an explicit native equivalent before they can be generated.',
        block,
      ),
    )
  }

  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = match[1]?.trim() ?? ''
    const declarations = match[2]?.trim() ?? ''
    if (!/^\.[a-z_][\w-]*$/i.test(selector)) {
      findings.push(
        finding(
          'unsupported-style',
          `The selector "${selector}" is not a single native class selector.`,
          block,
        ),
      )
      continue
    }
    for (const declaration of declarations.split(';')) {
      const property = declaration.split(':', 1)[0]?.trim()
      if (property !== undefined && property !== '' && !NATIVE_STYLE_PROPERTIES.has(property)) {
        findings.push(
          finding(
            'unsupported-style',
            `The CSS property "${property}" has no proven native mapping.`,
            block,
          ),
        )
      }
    }
  }
  return findings
}

/**
 * Compile one Vue SFC through the target-provider seam.
 *
 * The small interface is deliberate: callers receive a serialisable target
 * report and, only when every source construct is known, generated source.
 * Parsing, element mapping, event translation and failure accounting remain
 * local to this module.
 */
export function compileVueTarget(source: string, filename = 'Component.vue'): VueTargetOutput {
  const parsed = parseSfc(source, { filename })
  const findings: TargetFinding[] = []
  for (const error of parsed.errors) {
    const message = typeof error === 'string' ? error : error.message
    findings.push({ code: 'template-parse-failed', message, line: 1, column: 1 })
  }

  const template = parsed.descriptor.template
  if (template === null || parsed.errors.length > 0) {
    return { report: { schemaVersion: TARGET_VIEW_SCHEMA_VERSION, nodes: [], findings } }
  }

  const root = parseTemplate(template.content, {
    onError: (error) => {
      findings.push({
        code: 'template-parse-failed',
        message: error.message,
        line: error.loc?.start.line ?? 1,
        column: error.loc?.start.column ?? 1,
      })
    },
  })
  const nodes = readNodes(root.children, findings)
  const rendered = renderNodes(root.children)

  for (const style of parsed.descriptor.styles) {
    findings.push(...validateStyle(style.content, style))
  }

  const report: VueTargetReport = { schemaVersion: TARGET_VIEW_SCHEMA_VERSION, nodes, findings }
  if (findings.length > 0) return { report }

  const script = parsed.descriptor.scriptSetup ?? parsed.descriptor.script
  const scriptBlock = script === null ? '' : `${script.loc.source}\n`
  const styles = parsed.descriptor.styles
    .map(
      (style) =>
        `<style${style.scoped ? ' scoped' : ''}${style.lang === undefined ? '' : ` lang="${style.lang}"`}>${style.content}</style>`,
    )
    .join('\n')
  return { report, code: `${scriptBlock}<template>${rendered}</template>\n${styles}` }
}
