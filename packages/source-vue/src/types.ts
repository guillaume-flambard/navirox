import type { SourceLocation } from '@navirox/graph'

/**
 * A parsed manifest, with where it was read from.
 *
 * Small on purpose: the adapter reads three things out of it, and a fuller model
 * of `package.json` would be a model of a file rather than of a project.
 */
export interface Manifest {
  readonly json: Record<string, unknown>
  readonly source: SourceLocation
  readonly text: string
}

/** A dependency and the field that declared it. */
export interface DeclaredRange {
  readonly field: string
  readonly range: string
}
