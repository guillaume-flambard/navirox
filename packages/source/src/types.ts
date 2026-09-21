import type {
  AppGraphFragment,
  CapabilityUsage,
  Evidence,
  Finding,
  SourceDescriptor,
  SourceLocation,
  UnitKind,
} from '@memolabs-apps/graph'

/**
 * The source adapter contract.
 *
 * This is the other seam. The runtime seam lets a renderer be replaced without
 * touching the application; this one lets a source framework be added without
 * touching the core. The rule that makes it hold is the same in both cases: the
 * knowledge lives behind the seam and nowhere else.
 *
 * The contract is deliberately semantic. There is no `parseSfc`, no
 * `compileTemplate`, no `resolveComponent`. Those exist, they are the reason an
 * adapter is worth writing, and they belong to the adapter's own implementation.
 * What the core needs is narrower: what does this project look like, and what
 * does moving it involve.
 */

/** How far an adapter is trusted. Claimed by the adapter, never inferred. */
export type SupportLevel = 'experimental' | 'preview' | 'supported' | 'production'

/** The closed set a support level must come from. */
export const SUPPORT_LEVELS: readonly SupportLevel[] = [
  'experimental',
  'preview',
  'supported',
  'production',
]

export const DETECTION_CONFIDENCES = ['low', 'medium', 'high'] as const

export type DetectionConfidence = (typeof DETECTION_CONFIDENCES)[number]

/**
 * The versions of a framework an adapter has actually been exercised against.
 *
 * Declaring them is not decoration. A project on a major the adapter never saw
 * is a finding, not an implicit claim of support, and this is the data the
 * finding is built from.
 */
export interface AdapterVersionRange {
  readonly framework: string
  readonly versions: readonly string[]
}

/**
 * What detection is allowed to look at.
 *
 * Detection is the cheapest step and the one that must never throw, so it gets a
 * narrow, read-only view of the project rather than a filesystem it can wander.
 */
export interface DetectionContext {
  readonly rootDir: string
  /** Project files, as paths relative to `rootDir`, normalized to forward slashes. */
  readonly files: readonly string[]
  /** Reads a project file, or returns undefined when it does not exist. */
  readonly readText: (path: string) => string | undefined
}

/**
 * One framework an adapter believes it recognized, with the reason to believe it.
 *
 * The candidate does not name its own adapter. Attribution belongs to whoever
 * called `detect`, which knows which adapter it asked, and keeping it out of the
 * candidate removes a field that could disagree with the caller.
 */
export interface DetectionCandidate {
  readonly confidence: DetectionConfidence
  readonly evidence: readonly Evidence[]
}

/**
 * Detection is a list, never a single answer. A meta-framework matches both
 * itself and the framework it is built on, and the caller decides which one to
 * work with. An unsupported project returns an empty list rather than failing:
 * "nothing here knows this project" is a legitimate result.
 */
export interface DetectionResult {
  readonly candidates: readonly DetectionCandidate[]
}

/** What inspection is allowed to look at. Same shape as detection, by design. */
export interface InspectContext {
  readonly rootDir: string
  readonly files: readonly string[]
  readonly readText: (path: string) => string | undefined
}

/**
 * A file an adapter decided is one unit of the project.
 *
 * `key` is the part that makes an identifier deterministic: the adapter picks a
 * key that is stable for a given file and meaning, and the graph id helper turns
 * it into `<adapter-id>:<normalized-path>:<kind>:<key>`. The adapter owns the
 * key; the core never invents one.
 */
export interface DiscoveredUnit {
  readonly key: string
  readonly kind: UnitKind
  readonly name?: string
  readonly source: SourceLocation
  /** Framework specific detail, owned by the adapter and invisible to the core. */
  readonly metadata?: Readonly<Record<string, unknown>>
}

/**
 * A platform capability the project uses, and what it does with it.
 *
 * `unitKey` links the use back to the unit it was found in when the adapter
 * knows which one that is, which is what lets the graph carry an edge instead of
 * a loose fact.
 */
export interface DiscoveredCapability {
  readonly key: string
  readonly capability: string
  readonly usage: CapabilityUsage
  readonly source: SourceLocation
  readonly unitKey?: string
}

/**
 * A dependency exactly as the manifest declares it.
 *
 * There is no classification here on purpose. Whether a dependency can move is a
 * compatibility and planning question, and no compatibility facts exist yet, so
 * the honest payload is the name, the range and where it was read.
 */
export interface DiscoveredDependency {
  readonly key: string
  readonly name: string
  readonly version?: string
  readonly source?: SourceLocation
}

/**
 * A route the adapter could actually establish from the project.
 *
 * The list is empty when the adapter read no router it can extract routes from.
 * Inferring routes from a directory convention would produce nodes no source
 * line supports, which is why it is not done and why the adapter reports a
 * finding instead.
 */
export interface DiscoveredRoute {
  readonly key: string
  readonly pathPattern: string
  /** The file of the unit that renders this route, when the adapter can establish it. */
  readonly unitFile?: string
  readonly unitKey?: string
  readonly params?: readonly string[]
  readonly source: SourceLocation
}

/**
 * What an adapter learned about a project.
 *
 * Unsupported syntax, unknown dependencies and unclassifiable capabilities end
 * up here as findings or as explicit unknowns. An adapter that cannot understand
 * a construct reports it; it does not throw and it does not guess.
 *
 * The discovered collections are not optional. An adapter that found nothing
 * says so with an empty list, which is a statement, where an omitted field would
 * be an ambiguity the core would have to interpret.
 */
export interface SourceInspection {
  readonly descriptor: SourceDescriptor
  readonly units: readonly DiscoveredUnit[]
  readonly capabilities: readonly DiscoveredCapability[]
  readonly dependencies: readonly DiscoveredDependency[]
  readonly routes: readonly DiscoveredRoute[]
  readonly findings: readonly Finding[]
}

/** Context for turning an inspection into graph nodes. */
export interface GraphContext {
  readonly rootDir: string
}

/** Placeholder for the source-side half of migration, defined when that lands. */
export interface SourceMigrationProvider {
  readonly id: string
}

export interface SourceAdapter {
  /** Stable machine name. Becomes the first segment of every node id it produces. */
  readonly id: string
  readonly displayName: string
  readonly supportLevel: SupportLevel
  /**
   * Adapter ids this one is built on top of. A meta-framework lists the
   * framework adapter it composes, which is what makes selection prefer the
   * more specific adapter without the registry hardcoding any framework name.
   */
  readonly composes?: readonly string[]
  readonly testedVersions: readonly AdapterVersionRange[]
  detect(context: DetectionContext): Promise<DetectionResult>
  inspect(context: InspectContext): Promise<SourceInspection>
  buildGraph(inspection: SourceInspection, context: GraphContext): Promise<AppGraphFragment>
  migrations?(): readonly SourceMigrationProvider[]
}
