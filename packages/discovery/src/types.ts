/**
 * The repository capability manifest: a deterministic, hashed description of a
 * repository, produced before any graph or generated output.
 *
 * Every fact carries a source location and a confidence, so a consumer can tell
 * what was observed from what was guessed. Discovery never touches the
 * filesystem or the network itself: it reads through the injected
 * {@link DiscoveryReader} only.
 */

/** The only manifest schema version this package can produce or read. */
export const REPOSITORY_CAPABILITY_MANIFEST_SCHEMA_VERSION = 1

export type RepositoryCapabilityManifestSchemaVersion =
  typeof REPOSITORY_CAPABILITY_MANIFEST_SCHEMA_VERSION

/** How far a recorded fact is trusted. Never upgraded without evidence. */
export type DiscoveryConfidence = 'high' | 'medium' | 'low' | 'unknown'

/** Where a fact was observed. Paths are repository relative and normalized. */
export interface DiscoverySourceLocation {
  readonly file: string
}

/**
 * A single observed fact: the value, where it was read, and how far it is
 * trusted.
 */
export interface DiscoveryFact<T> {
  readonly value: T
  readonly location: DiscoverySourceLocation
  readonly confidence: DiscoveryConfidence
}

/**
 * The eligibility decision. Exactly one is recorded per manifest, and only
 * `eligible` may advance to transformation without further acceptance.
 */
export type EligibilityClassification =
  'eligible' | 'eligible-with-deltas' | 'manual-discovery-required' | 'refused'

/** Package managers discovery recognizes, each only on concrete evidence. */
export type PackageManagerKind = 'pnpm' | 'npm' | 'yarn' | 'bun' | 'unknown'

/** A lockfile observed in the repository. */
export interface LockfileRecord {
  readonly manager: Exclude<PackageManagerKind, 'unknown'>
  readonly path: string
}

/** How a workspace or monorepo orchestration was declared. */
export type WorkspaceDeclarationKind =
  'pnpm-workspace' | 'package-json-workspaces' | 'nx' | 'turborepo' | 'custom'

export interface WorkspaceDeclaration {
  readonly kind: WorkspaceDeclarationKind
  readonly path: string
}

/** A directory that holds a manifest (`package.json`). */
export interface PackageEntry {
  readonly name: string
  readonly path: string
  readonly manifestPath: string
}

/** A package that looks like an application: it has runnable entries. */
export interface ApplicationEntry {
  readonly name: string
  readonly path: string
}

/** A directory that holds generated output and is excluded from analysis. */
export interface GeneratedDirectory {
  readonly path: string
  readonly reason: string
}

/** A declared dependency and the version it resolved to, if evidence names it. */
export interface ResolvedVersion {
  readonly package: string
  readonly name: string
  readonly range: string
  readonly resolved: string | null
}

/**
 * A framework that could own the repository. An ambiguous repository records
 * several candidates with their own confidence instead of choosing one.
 */
export interface FrameworkCandidate {
  readonly framework: string
  readonly versionRange: string | null
  readonly major: number | null
  /** Human readable observations, for example `dependencies declares "vue"`. */
  readonly evidence: readonly string[]
}

/** A build or framework configuration file that was read. */
export type ConfigUnderstanding = 'understood' | 'listed-only' | 'unsupported'

export interface ConfigRecord {
  readonly path: string
  readonly kind: string
  readonly understanding: ConfigUnderstanding
}

/** A dependency that acts as a plugin (router, state, data, style, i18n). */
export interface PluginRecord {
  readonly name: string
  readonly range: string
  readonly package: string
  readonly understanding: ConfigUnderstanding
}

/** A declared way to build, run, test or enter the application. */
export type BuildEntryKind = 'script' | 'entry-file'

export interface BuildEntry {
  readonly name: string
  readonly kind: BuildEntryKind
  readonly target: string
}

/** An application convention observed by file shape, never interpreted. */
export interface ConventionRecord {
  readonly name: string
  readonly detail: string
}

/** A custom top level layout discovery lists but does not interpret. */
export interface CustomConvention {
  readonly path: string
}

/**
 * Something the lowering cannot follow: codegen, macros, eval, proprietary
 * loaders, direct DOM escapes, conditional imports, cross boundary imports and
 * unresolved dependencies. An escape hatch is declared before lowering, never
 * followed silently.
 */
export type EscapeHatchKind =
  | 'custom-build-driver'
  | 'opaque-shell-entry'
  | 'eval-use'
  | 'dynamic-import'
  | 'cross-boundary-import'
  | 'unresolved-dependency'

export interface EscapeHatch {
  readonly kind: EscapeHatchKind
  readonly detail: string
}

export type DiscoveryDiagnosticSeverity = 'info' | 'warning' | 'error'

/** A machine readable reason behind the classification or a delta. */
export interface DiscoveryDiagnostic {
  readonly code: string
  readonly message: string
  readonly severity: DiscoveryDiagnosticSeverity
}

/** One difference the caller must explicitly accept before advancing. */
export interface DiscoveryDelta {
  readonly id: string
  readonly description: string
}

/** Which discovery areas were examined and which lack evidence. */
export interface DiscoveryCoverage {
  readonly covered: readonly string[]
  readonly uncovered: readonly string[]
}

export interface RepositoryTopology {
  readonly gitRoots: DiscoveryFact<readonly string[]>
  readonly workspaceDeclarations: DiscoveryFact<readonly WorkspaceDeclaration[]>
  readonly packages: DiscoveryFact<readonly PackageEntry[]>
  readonly applications: DiscoveryFact<readonly ApplicationEntry[]>
  readonly generatedDirectories: DiscoveryFact<readonly GeneratedDirectory[]>
  readonly symlinks: DiscoveryFact<readonly string[]>
}

export interface RepositoryCapabilityManifest {
  readonly schemaVersion: RepositoryCapabilityManifestSchemaVersion
  /** Hex SHA-256 over the canonical form of this manifest. */
  readonly snapshotHash: string
  readonly root: string
  /** The selected application path, or null when none was selected. */
  readonly application: DiscoveryFact<string | null>
  readonly topology: RepositoryTopology
  readonly packageManager: DiscoveryFact<PackageManagerKind>
  readonly lockfiles: DiscoveryFact<readonly LockfileRecord[]>
  readonly resolvedVersions: DiscoveryFact<readonly ResolvedVersion[]>
  readonly frameworkCandidates: DiscoveryFact<readonly FrameworkCandidate[]>
  readonly configs: DiscoveryFact<readonly ConfigRecord[]>
  readonly plugins: DiscoveryFact<readonly PluginRecord[]>
  readonly buildEntries: DiscoveryFact<readonly BuildEntry[]>
  readonly conventions: DiscoveryFact<readonly ConventionRecord[]>
  readonly customConventions: DiscoveryFact<readonly CustomConvention[]>
  readonly escapeHatches: DiscoveryFact<readonly EscapeHatch[]>
  /** Every file actually read, sorted. */
  readonly filesRead: readonly string[]
  readonly deltas: readonly DiscoveryDelta[]
  readonly diagnostics: readonly DiscoveryDiagnostic[]
  readonly coverage: DiscoveryCoverage
  readonly classification: EligibilityClassification
}

/**
 * The injected reader. Discovery receives the bounded file list and a text
 * reader, and never runs a shell command, a build tool, or filesystem access
 * of its own.
 */
export interface DiscoveryReader {
  /** Repository relative paths the caller allows discovery to see. */
  readonly files: readonly string[]
  /** Returns the file text, or undefined when the file cannot be read. */
  readonly readText: (path: string) => string | undefined
  /** Declared symlinks, when the caller enumerates them. Absent means unknown. */
  readonly symlinks?: readonly string[]
}

export interface DiscoverOptions {
  /** Repository root label carried into the manifest. Defaults to `.`. */
  readonly root?: string
  /** Application path to select when the repository holds several. */
  readonly app?: string
}
