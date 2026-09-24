import type { AppGraph } from '@memolabs-apps/graph'
import type {
  EmissionFinding,
  EmissionResult,
  EmittedFile,
  Workflow,
} from '@memolabs-apps/workflow'

/**
 * The transformation seam.
 *
 * A source lowers its own syntax into the Workflow IR and a target emits from
 * that IR. The two sides meet at the IR and never import each other, which is
 * what lets a second framework or a second renderer join without re-welding the
 * pipeline.
 */

/** The part of an analysed application a lowering is asked to lower. */
export interface LoweringSelection {
  readonly rootDir: string
  readonly application?: string
}

/** What a lowering reads: the graph its adapter produced, at a known revision. */
export interface LoweringSnapshot {
  readonly adapterId: string
  readonly revision?: string
  readonly graph: AppGraph
}

/** The profile a lowering is asked to serve. */
export interface LoweringProfile {
  readonly id: string
}

/** How many nodes a lowering covered, by kind. */
export interface LoweringCoverage {
  readonly generated: number
  readonly manualRequired: number
  readonly excluded: number
  readonly refused: number
}

export interface LoweringFinding {
  readonly code: string
  readonly message: string
}

export interface LoweringResult {
  readonly workflow: Workflow
  readonly coverage: LoweringCoverage
  readonly findings: readonly LoweringFinding[]
}

/**
 * A source's lowering entry point.
 *
 * A provider is registered by a source adapter, so it may name its own framework.
 * It receives no target and asks no renderer anything.
 */
export interface SourceTransformProvider {
  readonly id: string
  lower(
    selection: LoweringSelection,
    snapshot: LoweringSnapshot,
    profile: LoweringProfile,
  ): LoweringResult | Promise<LoweringResult>
}

/** The neutral input a source-owned workspace provider receives. */
export interface WorkspaceScaffoldInput {
  readonly lowering: LoweringResult
  readonly emission: EmissionResult
}

/** The files, findings and package-local commands a workspace provider returns before the CLI writes them. */
export interface WorkspaceScaffoldResult {
  readonly files: readonly EmittedFile[]
  readonly findings: readonly EmissionFinding[]
  readonly commands: readonly string[]
}

/**
 * A source-owned workspace provider.
 *
 * The provider may own framework-specific project conventions, but it receives
 * only the neutral workflow and emission and returns planned files; it never
 * writes them.
 */
export interface WorkspaceProvider {
  readonly id: string
  scaffold(
    input: WorkspaceScaffoldInput,
  ): WorkspaceScaffoldResult | Promise<WorkspaceScaffoldResult>
}

// The target-side contract lives in the neutral IR package, not here: a target
// package may never import this one, so a target could not name a type declared
// in this file. It is re-exported so callers that already import it from
// `@memolabs-apps/source` keep working.
export type {
  EmissionFinding,
  EmissionResult,
  EmittedFile,
  TargetProfile,
  TargetProvider,
} from '@memolabs-apps/workflow'
