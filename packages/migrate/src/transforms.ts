import type { MigrationDecision } from '@memolabs-apps/planner'
import type { UnitNode } from '@memolabs-apps/graph'
import { resolveRelativeSpecifier } from './imports.js'

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
  /**
   * The rewrite rule that produced this content, when a rewrite happened.
   *
   * A byte-for-byte copy carries no rule; a transform that changed the bytes MUST
   * name the rule that fired, so no write is an anonymous rewrite.
   */
  readonly rule?: RewriteRule
}

export interface Transform {
  readonly id: string
  readonly family: TransformFamily
  readonly applies: (context: TransformContext) => boolean
  readonly write: (context: TransformContext) => readonly TransformWrite[]
}

/**
 * The rules a rewrite transform may apply, each with a stable identifier so a
 * write can cite the rule that produced it rather than presenting an anonymous
 * change.
 */
export const REWRITE_RULES = ['explicit-relative-extension'] as const

export type RewriteRule = (typeof REWRITE_RULES)[number]

const EXTENSION_CANDIDATES = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.vue',
  '.json',
] as const

/** The specifiers a file names, in the order they appear, with their quote. */
const RELATIVE_SPECIFIER = /(['"])(\.\.?\/[^'"\n]+)\1/g

/** True when a relative specifier already carries one of the known extensions. */
function hasExtension(specifier: string): boolean {
  const lastSegment = specifier.split('/').pop() ?? specifier

  return EXTENSION_CANDIDATES.some((extension) => lastSegment.endsWith(extension))
}

/** True when the plan moves this unit without a target rewrite. */
function isMovable(context: TransformContext): boolean {
  return (
    context.decision.classification === 'shared' || context.decision.classification === 'portable'
  )
}

/**
 * The rewritten text for a unit, or undefined when no rule changes it.
 *
 * A relative import the project wrote without an extension is resolved by the
 * source toolchain, but a native bundler does not guess, so the moved copy names
 * the extension explicitly. The rewrite only fires for a specifier it can
 * resolve, so it never invents a path, and the result depends only on the input,
 * which is what makes it deterministic.
 */
function rewriteRelativeExtensions(context: TransformContext): string | undefined {
  const content = context.readText(context.unit.source.file)

  if (content === undefined) {
    return undefined
  }

  const rewritten = content.replace(
    RELATIVE_SPECIFIER,
    (match, quote: string, specifier: string) => {
      if (hasExtension(specifier)) {
        return match
      }

      const resolved = resolveRelativeSpecifier(
        context.unit.source.file,
        specifier,
        (candidate) => context.readText(candidate) !== undefined,
      )

      if (resolved === undefined) {
        return match
      }

      const extension = EXTENSION_CANDIDATES.find((candidate) => resolved.endsWith(candidate))

      return extension === undefined ? match : `${quote}${specifier}${extension}${quote}`
    },
  )

  return rewritten === content ? undefined : rewritten
}

/**
 * The first transform: it copies the units the plan classified as shared or
 * portable, byte for byte.
 *
 * Those are the two classes the plan reserves for code that moves without a
 * rewrite. It steps aside for the rewrite transform below, so a unit is either
 * copied or rewritten, never both.
 */
export const copyMovableUnit: Transform = {
  id: 'copy-movable-unit',
  family: 'generic',
  applies: (context) => isMovable(context) && rewriteRelativeExtensions(context) === undefined,
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

/**
 * The bounded rewrite: it adds the explicit relative extension a native bundler
 * needs.
 *
 * It applies only to a unit the plan moves without a target rewrite and only when
 * a rule actually changes the file, so it never claims a copy it did not make.
 * Every write it emits cites `explicit-relative-extension`, and the same input
 * always produces the same output.
 */
export const addRelativeExtensions: Transform = {
  id: 'add-relative-extensions',
  family: 'generic',
  applies: (context) => isMovable(context) && rewriteRelativeExtensions(context) !== undefined,
  write: (context) => {
    const content = rewriteRelativeExtensions(context)

    if (content === undefined) {
      return []
    }

    return [
      {
        relativePath: context.unit.source.file,
        content,
        from: context.unit.source.file,
        rule: 'explicit-relative-extension' satisfies RewriteRule,
      },
    ]
  },
}

export const GENERIC_TRANSFORMS: readonly Transform[] = [copyMovableUnit, addRelativeExtensions]
