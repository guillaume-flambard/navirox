import { createHash } from 'node:crypto'

/**
 * The Workflow IR.
 *
 * A framework-neutral, versioned contract between a source lowering and a target
 * emission. It names no source framework, no target provider and no renderer, and
 * every node records how it is covered, so an incomplete workflow is an error
 * rather than a quiet best effort.
 */

export const PACKAGE_NAME = '@memolabs-apps/workflow'

export const PACKAGE_ROLE =
  'The framework-neutral Workflow IR: the versioned contract between a source lowering and a target emission.'

/** The schema version a reader must match. */
export const WORKFLOW_IR_SCHEMA_VERSION = 1 as const

/** How a node is covered by the transformation. */
export const COVERAGE_KINDS = ['generated', 'manual-required', 'excluded', 'refused'] as const

export type CoverageKind = (typeof COVERAGE_KINDS)[number]

/** Where a node came from, so every IR node keeps its provenance. */
export interface SourceRef {
  readonly adapterId: string
  readonly file: string
  readonly line?: number
  readonly column?: number
}

/** How a node is covered, with the reason a reviewer needs. */
export interface Coverage {
  readonly kind: CoverageKind
  readonly reason?: string
}

export interface Binding {
  readonly name: string
  readonly expression: string
}

export interface Action {
  readonly id: string
  readonly name: string
  readonly source: SourceRef
}

export interface StateModel {
  readonly name: string
  readonly kind: string
}

export interface LayoutConstraint {
  readonly axis: string
  readonly value: string
}

export interface StyleToken {
  readonly name: string
  readonly value: string
}

export interface Resource {
  readonly name: string
  readonly kind: string
  readonly path: string
}

export interface ViewNode {
  readonly id: string
  readonly primitive: string
  readonly source: SourceRef
  readonly coverage: Coverage
  readonly bindings: readonly Binding[]
  readonly children: readonly ViewNode[]
}

export interface Screen {
  readonly id: string
  readonly name: string
  readonly source: SourceRef
  readonly coverage: Coverage
  readonly nodes: readonly ViewNode[]
  readonly state: readonly StateModel[]
  readonly actions: readonly Action[]
  readonly layout: readonly LayoutConstraint[]
  readonly styles: readonly StyleToken[]
  readonly resources: readonly Resource[]
}

export interface Workflow {
  readonly schemaVersion: typeof WORKFLOW_IR_SCHEMA_VERSION
  readonly id: string
  readonly screens: readonly Screen[]
}

export type WorkflowFindingCode = 'unknown-coverage' | 'missing-source'

export interface WorkflowFinding {
  readonly code: WorkflowFindingCode
  readonly message: string
  readonly path: string
}

export class WorkflowIrError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WorkflowIrError'
  }
}

function sourceToJson(source: SourceRef): unknown {
  return {
    adapterId: source.adapterId,
    file: source.file,
    line: source.line ?? 0,
    column: source.column ?? 0,
  }
}

function coverageToJson(coverage: Coverage): unknown {
  return { kind: coverage.kind, reason: coverage.reason ?? '' }
}

function nodeToJson(node: ViewNode): unknown {
  return {
    id: node.id,
    primitive: node.primitive,
    source: sourceToJson(node.source),
    coverage: coverageToJson(node.coverage),
    bindings: node.bindings.map((binding) => ({
      name: binding.name,
      expression: binding.expression,
    })),
    children: node.children.map(nodeToJson),
  }
}

function screenToJson(screen: Screen): unknown {
  return {
    id: screen.id,
    name: screen.name,
    source: sourceToJson(screen.source),
    coverage: coverageToJson(screen.coverage),
    nodes: screen.nodes.map(nodeToJson),
    state: screen.state.map((model) => ({ name: model.name, kind: model.kind })),
    actions: screen.actions.map((action) => ({
      id: action.id,
      name: action.name,
      source: sourceToJson(action.source),
    })),
    layout: screen.layout.map((constraint) => ({
      axis: constraint.axis,
      value: constraint.value,
    })),
    styles: screen.styles.map((token) => ({ name: token.name, value: token.value })),
    resources: screen.resources.map((resource) => ({
      name: resource.name,
      kind: resource.kind,
      path: resource.path,
    })),
  }
}

/**
 * Serializes a workflow with a fixed field order.
 *
 * The order is the declaration order above, never the order a caller happened to
 * insert keys in, so the same workflow always produces the same bytes.
 */
export function serializeWorkflow(workflow: Workflow): string {
  const normalized = {
    schemaVersion: workflow.schemaVersion,
    id: workflow.id,
    screens: workflow.screens.map(screenToJson),
  }

  return `${JSON.stringify(normalized, undefined, 2)}\n`
}

export function hashWorkflow(workflow: Workflow): string {
  return createHash('sha256').update(serializeWorkflow(workflow), 'utf8').digest('hex')
}

function isCoverageKind(value: unknown): value is CoverageKind {
  return typeof value === 'string' && (COVERAGE_KINDS as readonly string[]).includes(value)
}

function isSource(value: unknown): value is SourceRef {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record['adapterId'] === 'string' && typeof record['file'] === 'string'
}

function checkNode(
  node: { readonly coverage?: unknown; readonly source?: unknown },
  path: string,
  findings: WorkflowFinding[],
): void {
  if (!isCoverageKind((node.coverage as Coverage | undefined)?.kind)) {
    findings.push({
      code: 'unknown-coverage',
      message: `${path} has no coverage in ${COVERAGE_KINDS.join(', ')}.`,
      path,
    })
  }

  if (!isSource(node.source)) {
    findings.push({
      code: 'missing-source',
      message: `${path} names no source location.`,
      path,
    })
  }
}

function checkViewNodes(
  nodes: readonly ViewNode[],
  path: string,
  findings: WorkflowFinding[],
): void {
  for (const [index, node] of nodes.entries()) {
    const nodePath = `${path}.nodes[${index}]`
    checkNode(node, nodePath, findings)
    checkViewNodes(node.children, nodePath, findings)
  }
}

/** Every way a workflow fails the contract, empty when it is complete. */
export function validateWorkflow(workflow: Workflow): readonly WorkflowFinding[] {
  const findings: WorkflowFinding[] = []

  if (!Array.isArray(workflow.screens)) {
    findings.push({
      code: 'missing-source',
      message: 'The workflow has no screens list.',
      path: 'screens',
    })
    return findings
  }

  for (const [index, screen] of workflow.screens.entries()) {
    const path = `screens[${index}]`
    checkNode(screen, path, findings)
    checkViewNodes(screen.nodes, path, findings)
  }

  return findings
}

/**
 * Reads a serialized workflow.
 *
 * A version this reader does not know is refused by name rather than guessed, and
 * an incomplete workflow is refused with its findings, so nothing emits a
 * workflow the contract does not cover.
 */
export function parseWorkflow(serialized: string): Workflow {
  let parsed: unknown

  try {
    parsed = JSON.parse(serialized)
  } catch (error) {
    throw new WorkflowIrError(
      `The workflow is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new WorkflowIrError('The workflow is not an object.')
  }

  const record = parsed as Record<string, unknown>
  const version = record['schemaVersion']

  if (version !== WORKFLOW_IR_SCHEMA_VERSION) {
    throw new WorkflowIrError(
      `This reader speaks workflow IR schema version ${WORKFLOW_IR_SCHEMA_VERSION}, and the workflow declares ${String(version)}.`,
    )
  }

  const workflow = parsed as Workflow
  const findings = validateWorkflow(workflow)

  if (findings.length > 0) {
    throw new WorkflowIrError(
      `The workflow is incomplete: ${findings.map((finding) => `${finding.path} (${finding.code})`).join(', ')}.`,
    )
  }

  return workflow
}

/** The target profile an emission serves. */
export interface TargetProfile {
  readonly id: string
}

export interface EmittedFile {
  readonly path: string
  readonly content: string
}

/** A finding a target reports. It is neutral: it names no source framework. */
export interface EmissionFinding {
  readonly code: string
  readonly message: string
}

export interface EmissionResult {
  readonly files: readonly EmittedFile[]
  readonly findings: readonly EmissionFinding[]
}

/**
 * A target's emission entry point.
 *
 * It receives the IR and a target profile, and knows no source framework. It
 * lives in this neutral package rather than beside the lowering contract because
 * a target package may never import the source-side seam package, so a target
 * could not name a type declared there.
 */
export interface TargetProvider {
  readonly id: string
  emit(workflow: Workflow, profile: TargetProfile): EmissionResult | Promise<EmissionResult>
}
