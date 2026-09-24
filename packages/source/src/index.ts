export const PACKAGE_NAME = '@memolabs-apps/source'

export const PACKAGE_ROLE =
  'The source adapter contract, the adapter registry, and the framework import boundary that keeps the core neutral.'

export {
  DuplicateAdapterError,
  UnknownAdapterError,
  SourceAdapterRegistry,
  selectAdapter,
} from './registry.js'
export type { DetectedSource } from './registry.js'

export { verifyAdapterContract } from './contract.js'
export type { AdapterContractViolation } from './contract.js'

export {
  APPLICATION_EXTENSIONS,
  CONFIG_FILE_NAMES,
  CONFIG_FILE_PATTERN,
  ENTRY_FILE_NAMES,
  IGNORED_DIRECTORIES,
  SOURCE_EXTENSIONS,
  TEST_DIRECTORIES,
  TEST_FILE_PATTERN,
  isApplicationModule,
  isIgnoredPath,
  isSourceFile,
} from './files.js'

export { createProjectFiles } from './project.js'
export type { ProjectFiles } from './project.js'

export {
  CAPABILITY_PATTERNS,
  DECLARED_CAPABILITIES,
  DOM_PATTERNS,
  scanCapabilities,
  stripComments,
} from './capabilities.js'
export type { CapabilityMatch, CapabilityPattern } from './capabilities.js'

export { buildFragment } from './fragment.js'

export { declaredMajor, testedMajors } from './versions.js'

export { checkVerifiedRange, resolveAdapterVersions } from './version-gate.js'
export type {
  AdapterVersionSources,
  VersionGateInput,
  VersionGateOutcome,
  VersionRefusal,
} from './version-gate.js'

export { MANIFEST_FILE, declaredRange, productionDependencies, readManifest } from './manifest.js'
export type { DeclaredRange, Manifest, TextReader } from './manifest.js'

export {
  ADAPTER_PACKAGE_PREFIX,
  NEUTRAL_PACKAGE_DIRS,
  SOURCE_FRAMEWORK_PATTERNS,
  SOURCE_PROVIDER_PATTERNS,
  TARGET_PACKAGE_PREFIX,
  TARGET_PROVIDER_PATTERNS,
  forbiddenSpecifiers,
  importSpecifiers,
  isNeutralPackageDir,
  isSourceAdapterPackageDir,
  isTargetProviderPackageDir,
  matchesPattern,
} from './boundaries.js'

export { DETECTION_CONFIDENCES, SUPPORT_LEVELS } from './types.js'
export type {
  AdapterVersionRange,
  DetectionCandidate,
  DetectionConfidence,
  DetectionContext,
  DetectionResult,
  DiscoveredCapability,
  DiscoveredDependency,
  DiscoveredRoute,
  DiscoveredUnit,
  GraphContext,
  InspectContext,
  SourceAdapter,
  SourceInspection,
  SourceMigrationProvider,
  SupportLevel,
} from './types.js'

export type {
  EmissionResult,
  EmittedFile,
  LoweringCoverage,
  LoweringFinding,
  LoweringProfile,
  LoweringResult,
  LoweringSelection,
  LoweringSnapshot,
  SourceTransformProvider,
  TargetProfile,
  TargetProvider,
  WorkspaceProvider,
  WorkspaceScaffoldInput,
  WorkspaceScaffoldResult,
} from './transform-seam.js'
