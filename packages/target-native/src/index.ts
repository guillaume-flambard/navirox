import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  hashWorkflow,
  type Binding,
  type EmissionFinding,
  type EmissionResult,
  type EmittedFile,
  type Screen,
  type StateModel,
  type TargetProvider,
  type ViewNode,
  type Workflow,
} from '@memolabs-apps/workflow'

/**
 * The neutral native target.
 *
 * It reads the Workflow IR and emits one native single file component per screen
 * the lowering actually covered, plus a provenance manifest per screen. A screen
 * whose coverage is not `generated` is refused with a finding and no file: a
 * best-effort screen for uncovered input would present it as migrated.
 *
 * `TargetProvider` and `EmissionResult` come from the neutral IR package, which a
 * target may import; the source-side seam package is forbidden to a target.
 */

export const PACKAGE_NAME = '@memolabs-apps/target-native'

export const PACKAGE_ROLE =
  'The neutral target provider: it emits native single file components and provenance manifests from the Workflow IR.'

const PROVIDER_ID = 'native-workflow-emission'

interface ScreenManifest {
  readonly workflowHash: string
  readonly targetVersion: string
  readonly outputPath: string
  readonly screenId: string
}

const HERE = dirname(fileURLToPath(import.meta.url))
const OWN_MANIFEST_PATH = join(HERE, '..', 'package.json')

function readTargetVersion(): string {
  const manifest = JSON.parse(readFileSync(OWN_MANIFEST_PATH, 'utf8')) as {
    readonly version?: unknown
  }

  if (typeof manifest.version !== 'string' || manifest.version === '') {
    throw new Error(
      `The target-native manifest at "${OWN_MANIFEST_PATH}" has no version, so emitted screens cannot record which target produced them.`,
    )
  }

  return manifest.version
}

function renderBinding(binding: Binding): string | undefined {
  if (binding.name === 'text') return undefined
  if (binding.name === 'testID') return ` testID="${binding.expression}"`
  if (binding.name.startsWith('on-')) {
    return ` @${binding.name.slice(3)}="${binding.expression}"`
  }
  if (
    binding.name === 'v-if' ||
    binding.name === 'v-else-if' ||
    binding.name === 'v-else' ||
    binding.name === 'v-for' ||
    binding.name === 'v-model'
  ) {
    return ` ${binding.name}="${binding.expression}"`
  }
  if (binding.name === 'v-bind') return ` :value="${binding.expression}"`
  return ` :${binding.name}="${binding.expression}"`
}

function renderAttributes(node: ViewNode): string {
  return node.bindings
    .map(renderBinding)
    .filter((attribute): attribute is string => attribute !== undefined)
    .join('')
}

function renderText(node: ViewNode): string {
  return node.bindings
    .filter((binding) => binding.name === 'text')
    .map((binding) => `{{ ${binding.expression} }}`)
    .join('')
}

function renderNode(node: ViewNode): string {
  const children = node.children.map(renderNode).join('')
  return `<${node.primitive}${renderAttributes(node)}>${renderText(node)}${children}</${node.primitive}>`
}

/**
 * The screen state as a small script setup block, declared as refs so the
 * emitted component is a runnable Vue single file component. An empty state
 * emits no block at all rather than an unused import.
 */
function renderScript(state: readonly StateModel[]): string {
  if (state.length === 0) return ''

  const declarations = state.map((model) => `const ${model.name} = ref(0)`).join('\n')
  return `<script setup>\nimport { ref } from 'vue'\n${declarations}\n</script>\n\n`
}

function renderTemplate(screen: Screen): string {
  const body = screen.nodes.map(renderNode).join('')

  return `<template>${body}</template>`
}

function renderComponent(screen: Screen): string {
  return `${renderScript(screen.state)}${renderTemplate(screen)}\n`
}

/** Fixed field order, so the same workflow always emits the same manifest bytes. */
function serializeManifest(manifest: ScreenManifest): string {
  return `${JSON.stringify(manifest, undefined, 2)}\n`
}

function screenFileStem(screen: Screen): string {
  const sourceName =
    screen.source.file
      .split('/')
      .at(-1)
      ?.replace(/\.vue$/, '') ?? ''
  const candidate = screen.name || sourceName || screen.id
  return candidate.replace(/[^A-Za-z0-9_-]+/g, '-') || 'screen'
}

function uniqueScreenFileStem(screen: Screen, used: Set<string>): string {
  const base = screenFileStem(screen)
  let candidate = base
  let suffix = 2

  while (used.has(candidate)) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }

  used.add(candidate)
  return candidate
}

function emit(workflow: Workflow): EmissionResult {
  const files: EmittedFile[] = []
  const findings: EmissionFinding[] = []
  const usedStems = new Set<string>()
  const workflowHash = hashWorkflow(workflow)
  const targetVersion = readTargetVersion()

  for (const screen of workflow.screens) {
    if (screen.coverage.kind !== 'generated') {
      findings.push({
        code: 'uncovered-screen',
        message: `The screen "${screen.id}" has coverage "${screen.coverage.kind}" and was not emitted.`,
      })
      continue
    }

    const fileStem = uniqueScreenFileStem(screen, usedStems)
    const outputPath = `generated/${fileStem}.vue`
    files.push({ path: outputPath, content: renderComponent(screen) })
    files.push({
      path: `generated/${fileStem}.manifest.json`,
      content: serializeManifest({ workflowHash, targetVersion, outputPath, screenId: screen.id }),
    })
  }

  return { files, findings }
}

/** Creates the native target as a registered target transform provider. */
export function createNativeTarget(): TargetProvider {
  return { id: PROVIDER_ID, emit }
}
