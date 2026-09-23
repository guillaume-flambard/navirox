import type { AppGraph } from '@memolabs-apps/graph'
import type { Workflow } from '@memolabs-apps/workflow'

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

/** The target profile an emission serves. */
export interface TargetProfile {
  readonly id: string
}

export interface EmittedFile {
  readonly path: string
  readonly content: string
}

export interface EmissionResult {
  readonly files: readonly EmittedFile[]
  readonly findings: readonly LoweringFinding[]
}

/**
 * A target's emission entry point.
 *
 * It receives the IR and a target profile, and knows no source framework.
 */
export interface TargetProvider {
  readonly id: string
  emit(workflow: Workflow, profile: TargetProfile): EmissionResult | Promise<EmissionResult>
}
