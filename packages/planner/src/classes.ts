import type { Evidence, NodeId } from '@navirox/graph'

/**
 * The migration decision model.
 *
 * The shape of this file is the argument. A decision cannot be constructed
 * without a classification from the closed set and without at least one reason
 * and one piece of evidence, because the failure mode that matters here is not a
 * missing decision, it is a confident one that cannot say why it was made.
 *
 * `unknown` and `manual` are first class members of the set, not error states.
 * They are what an honest layer answers when it does not know, and the report
 * exists partly to make that extent visible.
 */

/** The closed set of things a part of a project can be. */
export const MIGRATION_CLASSES = [
  'shared',
  'portable',
  'adaptable',
  'native-replacement',
  'web-fallback',
  'manual',
  'unknown',
] as const

export type MigrationClass = (typeof MIGRATION_CLASSES)[number]

export const CONFIDENCES = ['low', 'medium', 'high'] as const

export type Confidence = (typeof CONFIDENCES)[number]

/** Why a decision was made, and which rule made it. */
export interface DecisionReason {
  /** The identifier of the rule that decided. */
  readonly ruleId: string
  readonly message: string
}

/** What a node was classified as, and on what basis. */
export interface MigrationDecision {
  readonly subject: NodeId
  readonly classification: MigrationClass
  readonly confidence: Confidence
  readonly reasons: readonly DecisionReason[]
  readonly evidence: readonly Evidence[]
  /** What would have to be true for a better answer, when there is one. */
  readonly blockers?: readonly string[]
}
