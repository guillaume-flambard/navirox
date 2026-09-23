/** Canonical npm name of this package. Kept in code so the import boundary
 *  checks can assert against it without reading package.json. */
export const PACKAGE_NAME = '@memolabs-apps/compat'

/** One line describing this package's role in the Navirox stack. */
export const PACKAGE_ROLE =
  'Compatibility records: what Navirox knows works on a native target, and the evidence behind each claim.'

export { SEED_RECORDS } from './records.js'
export { SEED_VERSION_MATRIX, loadSeedVersionMatrix } from './version-matrix-data.js'
export {
  REQUALIFICATION_GATES,
  RequalificationDataError,
  openRequalification,
} from './requalification.js'
export type {
  Requalification,
  RequalificationGate,
  RequalificationInput,
  RequalificationStatus,
} from './requalification.js'
export {
  CompatibilityDataError,
  CompatibilityRegistry,
  loadSeedRegistry,
  parseRegistry,
} from './registry.js'
export {
  COMPATIBILITY_SCHEMA_VERSION,
  COMPATIBILITY_STATUSES,
  EVIDENCE_LEVELS,
  SUBJECT_KINDS,
  subjectKey,
} from './types.js'
export {
  OUTSIDE_VERIFIED_RANGE,
  VERSION_MATRIX_GATES,
  VERSION_MATRIX_SCHEMA_VERSION,
  VersionMatrix,
  VersionMatrixDataError,
  parseVersionMatrix,
  versionMatrixKey,
} from './version-matrix.js'
export type {
  VersionMatrixEvidence,
  VersionMatrixGate,
  VersionMatrixRow,
} from './version-matrix.js'
export type {
  CompatibilityEvidence,
  CompatibilityRecord,
  CompatibilityStatus,
  CompatibilitySubject,
  EvidenceLevel,
  SubjectKind,
} from './types.js'
