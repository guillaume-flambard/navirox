/**
 * What Navirox knows about compatibility, and how strongly it knows it.
 *
 * Two axes, kept apart on purpose. The status is the claim; the evidence level is
 * what the claim rests on. Collapsing them would make a documented statement and a
 * package that has been built and run on a device indistinguishable, and telling
 * those apart is the product's whole argument.
 */

/** The registry schema version. */
export const COMPATIBILITY_SCHEMA_VERSION = 1

/** What a record is about. Only some kinds carry data today; the model names them all. */
export const SUBJECT_KINDS = [
  'package',
  'capability',
  'source-framework',
  'target',
  'runtime',
  'platform',
] as const

export type SubjectKind = (typeof SUBJECT_KINDS)[number]

/** The claim. */
export const COMPATIBILITY_STATUSES = [
  'supported',
  'supported-with-adapter',
  'partial',
  'blocked',
  'unknown',
  'not-applicable',
] as const

export type CompatibilityStatus = (typeof COMPATIBILITY_STATUSES)[number]

/** What the claim rests on. */
export const EVIDENCE_LEVELS = [
  'documented',
  'fixture-tested',
  'unit-tested',
  'integration-tested',
  'ios-build-tested',
  'android-build-tested',
  'production-reported',
] as const

export type EvidenceLevel = (typeof EVIDENCE_LEVELS)[number]

export interface CompatibilitySubject {
  readonly kind: SubjectKind
  readonly name: string
  /** The range as written, never resolved. Satisfying a range is a separate problem. */
  readonly range?: string
}

export interface CompatibilityEvidence {
  readonly level: EvidenceLevel
  /** Where the demonstration lives: a file, a run, a build. */
  readonly source: string
}

export interface CompatibilityRecord {
  readonly subject: CompatibilitySubject
  readonly status: CompatibilityStatus
  readonly evidence: readonly CompatibilityEvidence[]
  readonly notes: string
}

/** The key a subject is looked up and indexed by. */
export function subjectKey(subject: CompatibilitySubject): string {
  return `${subject.kind}:${subject.name}`
}
