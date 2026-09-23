/** Canonical npm name of this package. Kept in code so the import
 *  boundary checks can assert against it without reading package.json. */
export const PACKAGE_NAME = '@memolabs-apps/discovery'

/** One line describing this package's role in the Navirox stack. */
export const PACKAGE_ROLE =
  'The deterministic repository capability manifest produced before any graph or generated output.'

export { REPOSITORY_CAPABILITY_MANIFEST_SCHEMA_VERSION } from './types.js'
export type {
  ApplicationEntry,
  BuildEntry,
  ConfigRecord,
  ConfigUnderstanding,
  ConventionRecord,
  CustomConvention,
  DiscoverOptions,
  DiscoveryConfidence,
  DiscoveryCoverage,
  DiscoveryDelta,
  DiscoveryDiagnostic,
  DiscoveryDiagnosticSeverity,
  DiscoveryFact,
  DiscoveryReader,
  DiscoverySourceLocation,
  EligibilityClassification,
  EscapeHatch,
  EscapeHatchKind,
  FrameworkCandidate,
  GeneratedDirectory,
  LockfileRecord,
  PackageEntry,
  PackageManagerKind,
  PluginRecord,
  RepositoryCapabilityManifest,
  RepositoryCapabilityManifestSchemaVersion,
  RepositoryTopology,
  ResolvedVersion,
  WorkspaceDeclaration,
  WorkspaceDeclarationKind,
} from './types.js'

export { createMemoryReader } from './readers.js'

export { canAdvance, discoverRepository, serializeManifest, snapshotHashOf } from './discover.js'
