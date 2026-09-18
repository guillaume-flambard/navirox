/** Canonical npm name of this package. Kept in code so the import boundary
 *  checks can assert against it without reading package.json. */
export const PACKAGE_NAME = '@navirox/compat'

/** One line describing this package's role in the Navirox stack. */
export const PACKAGE_ROLE =
  'Compatibility records: what Navirox knows works on a native target, and the evidence behind each claim.'

export { SEED_RECORDS } from './records.js'
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
export type {
  CompatibilityEvidence,
  CompatibilityRecord,
  CompatibilityStatus,
  CompatibilitySubject,
  EvidenceLevel,
  SubjectKind,
} from './types.js'
