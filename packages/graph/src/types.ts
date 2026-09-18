/**
 * The App Graph: the framework-neutral model inspection produces.
 *
 * It is a migration model, not a syntax tree. A concept belongs here only when a
 * second adapter needs it, or a migration or target decision consumes it, or a
 * user-visible tool decision depends on it. Anything specific to one framework
 * stays in that adapter's own metadata.
 */

/** The only graph version this package can produce or read. */
export const APP_GRAPH_SCHEMA_VERSION = 1

export type GraphSchemaVersion = typeof APP_GRAPH_SCHEMA_VERSION

/** A stable, deterministic identifier for a graph node. */
export type NodeId = string

/** A position inside a source file, one based to match editors. */
export interface SourcePosition {
  readonly line: number
  readonly column: number
}

/**
 * Where a node came from. Every node carries one so that no decision is
 * untraceable back to the file and adapter that produced it.
 */
export interface SourceLocation {
  /** Normalized, repository relative path of the file. */
  readonly file: string
  /** The adapter that read the file. */
  readonly adapterId: string
  readonly start?: SourcePosition
  readonly end?: SourcePosition
}

/**
 * The closed set of observations a finding may rest on. An evidence entry is the
 * observable fact, never a conclusion drawn from one.
 */
export type EvidenceKind =
  'source' | 'manifest' | 'compiler' | 'compat-registry' | 'build' | 'fixture' | 'user-override'

export interface Evidence {
  readonly kind: EvidenceKind
  readonly value: string
}

export type FindingSeverity = 'info' | 'warning' | 'error'

/**
 * Something inspection observed but could not turn into a node, or a fact the
 * user needs to know about. A finding without a file is valid: project wide
 * observations are still findings, and their evidence carries the fact.
 */
export interface Finding {
  readonly id: string
  readonly code: string
  readonly severity: FindingSeverity
  readonly title: string
  readonly message: string
  readonly evidence: readonly Evidence[]
  readonly source?: SourceLocation
}

/** What an application does with a platform or browser capability. */
export type CapabilityUsage = 'read' | 'write' | 'invoke' | 'render' | 'unknown'

/**
 * What kind of thing a unit is. Framework constructs are deliberately absent:
 * a directive, decorator or signal is adapter metadata, never a unit kind.
 */
export type UnitKind =
  | 'screen'
  | 'component'
  | 'layout'
  | 'state-module'
  | 'data-client'
  | 'domain-module'
  | 'utility'
  | 'asset'
  | 'unknown'

export interface RouteNode {
  readonly id: NodeId
  readonly pathPattern: string
  readonly screenId?: NodeId
  readonly params?: readonly string[]
  readonly source: SourceLocation
}

export interface ScreenNode {
  readonly id: NodeId
  readonly name?: string
  readonly unitId: NodeId
  readonly routeIds: readonly NodeId[]
  readonly source: SourceLocation
}

export interface UnitNode {
  readonly id: NodeId
  readonly kind: UnitKind
  readonly source: SourceLocation
  readonly dependencies: readonly NodeId[]
  /** Adapter owned. The only place a framework construct may be recorded. */
  readonly metadata?: Readonly<Record<string, unknown>>
}

export interface ActionNode {
  readonly id: NodeId
  readonly name: string
  readonly source: SourceLocation
  readonly metadata?: Readonly<Record<string, unknown>>
}

export interface DataNode {
  readonly id: NodeId
  readonly name: string
  readonly source: SourceLocation
  readonly metadata?: Readonly<Record<string, unknown>>
}

export interface CapabilityNode {
  readonly id: NodeId
  /** The capability itself, for example `local-storage` or `geolocation`. */
  readonly capability: string
  readonly usage: CapabilityUsage
  readonly source: SourceLocation
}

export interface DependencyNode {
  readonly id: NodeId
  readonly name: string
  readonly version?: string
  readonly source?: SourceLocation
}

export interface GraphEdge {
  readonly from: NodeId
  readonly to: NodeId
  readonly kind: string
}

/**
 * A source adapter's contribution to a graph. It holds no schema version and no
 * source descriptor: the core owns those, so an adapter cannot claim a version
 * it does not speak.
 */
export interface AppGraphFragment {
  readonly routes: readonly RouteNode[]
  readonly screens: readonly ScreenNode[]
  readonly units: readonly UnitNode[]
  readonly actions: readonly ActionNode[]
  readonly data: readonly DataNode[]
  readonly capabilities: readonly CapabilityNode[]
  readonly dependencies: readonly DependencyNode[]
  readonly edges: readonly GraphEdge[]
  readonly findings: readonly Finding[]
}

/** Who produced a graph and what it described. */
export interface SourceDescriptor {
  readonly adapterId: string
  readonly displayName: string
  readonly frameworkVersion?: string
  readonly metaFramework?: string
}

export interface AppGraph extends AppGraphFragment {
  readonly schemaVersion: GraphSchemaVersion
  readonly source: SourceDescriptor
}

/** An empty fragment, so an adapter can always return a well formed result. */
export function emptyGraphFragment(): AppGraphFragment {
  return {
    routes: [],
    screens: [],
    units: [],
    actions: [],
    data: [],
    capabilities: [],
    dependencies: [],
    edges: [],
    findings: [],
  }
}
