import type { MigrationDecision } from '@navirox/planner'
import type { UnitNode } from '@navirox/graph'

/**
 * What a transform is allowed to do.
 *
 * A transform declares a family, the units it applies to, and the files it wants
 * written. It never touches the filesystem itself: the engine collects the writes,
 * checks every path against the output boundary, and performs them, which is what
 * makes a dry run and a rollback possible at all.
 */

export const TRANSFORM_FAMILIES = ['source', 'generic', 'target'] as const

export type TransformFamily = (typeof TRANSFORM_FAMILIES)[number]

export interface TransformContext {
  readonly unit: UnitNode
  readonly decision: MigrationDecision
  /** Reads a source file, relative to the source root. */
  readonly readText: (path: string) => string | undefined
}

export interface TransformWrite {
  /** Where the file goes, relative to the output root. */
  readonly relativePath: string
  readonly content: string
  /** The source file the content came from, for the report. */
  readonly from: string
}

export interface Transform {
  readonly id: string
  readonly family: TransformFamily
  readonly applies: (context: TransformContext) => boolean
  readonly write: (context: TransformContext) => readonly TransformWrite[]
}

/**
 * The first transform, and deliberately the only one.
 *
 * It copies the units the plan classified as shared, byte for byte. Logic with no
 * platform capability use is the one thing that can move without any chance of
 * changing behaviour, and it exercises the whole machine: selection, output paths,
 * state, idempotence and rollback. A rewrite would have needed a proof this
 * repository does not have yet.
 */
export const copySharedUnit: Transform = {
  id: 'copy-shared-unit',
  family: 'generic',
  applies: (context) => context.decision.classification === 'shared',
  write: (context) => {
    const content = context.readText(context.unit.source.file)

    if (content === undefined) {
      return []
    }

    return [
      {
        relativePath: context.unit.source.file,
        content,
        from: context.unit.source.file,
      },
    ]
  },
}

export const GENERIC_TRANSFORMS: readonly Transform[] = [copySharedUnit]
