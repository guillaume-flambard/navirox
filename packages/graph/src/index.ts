/** Canonical npm name of this package. Kept in code so the import
 *  boundary checks can assert against it without reading package.json. */
export const PACKAGE_NAME = '@navirox/graph'

/** One line describing this package's role in the Navirox stack. */
export const PACKAGE_ROLE =
  'The framework-neutral App Graph schema and its deterministic node identifiers.'

export { findingId, nodeId, normalizePath } from './ids.js'
export type { FindingIdParts, NodeIdParts } from './ids.js'

export { APP_GRAPH_SCHEMA_VERSION, emptyGraphFragment } from './types.js'
export type {
  ActionNode,
  AppGraph,
  AppGraphFragment,
  CapabilityNode,
  CapabilityUsage,
  DataNode,
  DependencyNode,
  Evidence,
  EvidenceKind,
  Finding,
  FindingSeverity,
  GraphEdge,
  GraphSchemaVersion,
  NodeId,
  RouteNode,
  ScreenNode,
  SourceDescriptor,
  SourceLocation,
  SourcePosition,
  UnitKind,
  UnitNode,
} from './types.js'
