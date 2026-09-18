import type { NodeId } from './types.js'

/**
 * Deterministic identifiers for graph nodes.
 *
 * The identifier is derived, never generated. Re-inspecting an unchanged project
 * has to produce the same ids, because the migration state file keys work off
 * them; a random id would make every inspection look like a new project. The
 * pattern is `<adapter-id>:<normalized-path>:<kind>:<key>`.
 */

/** The inputs an id is derived from. */
export interface NodeIdParts {
  /** The id of the adapter that produced the node. */
  readonly adapterId: string
  /** Repository relative path of the source file. Normalized before use. */
  readonly path: string
  /** The semantic kind of the node, for example `screen` or `component`. */
  readonly kind: string
  /** Distinguishes several nodes of one kind inside one file. */
  readonly key: string
}

/** The inputs a finding id is derived from. */
export interface FindingIdParts {
  readonly adapterId: string
  /** Stable code naming the observation, for example `unsupported-syntax`. */
  readonly code: string
  /** Distinguishes findings that share a code. */
  readonly key: string
}

/**
 * Collapses the path spellings that name one file into one string, so that a
 * Windows separator or a `./` prefix cannot change a node's identity.
 */
export function normalizePath(path: string): string {
  const slashed = path.replace(/\\/g, '/')
  const relative = slashed.replace(/^(\.\/)+/, '')
  const collapsed = relative.replace(/\/{2,}/g, '/')
  return collapsed.length > 1 && collapsed.endsWith('/') ? collapsed.slice(0, -1) : collapsed
}

/** Builds the stable id of a node derived from source. */
export function nodeId(parts: NodeIdParts): NodeId {
  return [parts.adapterId, normalizePath(parts.path), parts.kind, parts.key].join(':')
}

/** Builds the stable id of a finding. */
export function findingId(parts: FindingIdParts): NodeId {
  return [parts.adapterId, 'finding', parts.code, parts.key].join(':')
}
