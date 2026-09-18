import type { CompatibilityRecord, CompatibilitySubject } from './types.js'
import { COMPATIBILITY_STATUSES, EVIDENCE_LEVELS, SUBJECT_KINDS, subjectKey } from './types.js'
import { SEED_RECORDS } from './records.js'

/**
 * Loading and lookup.
 *
 * Loading validates, because the failure this model exists to prevent is a claim
 * nothing supports. A record without evidence is not a weak record, it is not a
 * record, and it fails the load by name.
 */

export class CompatibilityDataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CompatibilityDataError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseEvidence(value: unknown, where: string): void {
  if (!Array.isArray(value) || value.length === 0) {
    throw new CompatibilityDataError(`${where} declares no evidence, so nothing supports it.`)
  }

  for (const entry of value) {
    if (!isRecord(entry)) {
      throw new CompatibilityDataError(`${where} has an evidence entry that is not an object.`)
    }

    if (!EVIDENCE_LEVELS.includes(entry['level'] as never)) {
      throw new CompatibilityDataError(
        `${where} has an evidence level outside the declared set: ${String(entry['level'])}.`,
      )
    }

    if (typeof entry['source'] !== 'string' || entry['source'].length === 0) {
      throw new CompatibilityDataError(`${where} has an evidence entry that names no source.`)
    }
  }
}

function parseRecord(value: unknown, index: number): CompatibilityRecord {
  const where = `record ${index}`

  if (!isRecord(value)) {
    throw new CompatibilityDataError(`${where} is not an object.`)
  }

  const subject = value['subject']
  const status = value['status']
  const notes = value['notes']

  if (!isRecord(subject) || typeof subject['name'] !== 'string') {
    throw new CompatibilityDataError(`${where} names no subject.`)
  }

  if (!SUBJECT_KINDS.includes(subject['kind'] as never)) {
    throw new CompatibilityDataError(
      `${where} has a subject kind outside the declared set: ${String(subject['kind'])}.`,
    )
  }

  if (!COMPATIBILITY_STATUSES.includes(status as never)) {
    throw new CompatibilityDataError(
      `${where} has a status outside the declared set: ${String(status)}.`,
    )
  }

  if (typeof notes !== 'string' || notes.length === 0) {
    throw new CompatibilityDataError(`${where} has no note explaining it.`)
  }

  parseEvidence(value['evidence'], where)

  return value as unknown as CompatibilityRecord
}

/** Parses registry data, refusing anything a reader would have to take on trust. */
export function parseRegistry(data: unknown): readonly CompatibilityRecord[] {
  if (!Array.isArray(data)) {
    throw new CompatibilityDataError('The registry data is not a list of records.')
  }

  return data.map((entry, index) => parseRecord(entry, index))
}

export class CompatibilityRegistry {
  readonly #records: Map<string, CompatibilityRecord>

  constructor(records: readonly CompatibilityRecord[]) {
    this.#records = new Map()

    for (const record of records) {
      const key = subjectKey(record.subject)
      const existing = this.#records.get(key)

      if (existing !== undefined && existing.status !== record.status) {
        throw new CompatibilityDataError(
          `Two records disagree about ${key}: ${existing.status} and ${record.status}.`,
        )
      }

      this.#records.set(key, record)
    }
  }

  has(subject: CompatibilitySubject): boolean {
    return this.#records.has(subjectKey(subject))
  }

  /** The record for a subject, or undefined. An unknown subject is not an error. */
  lookup(subject: CompatibilitySubject): CompatibilityRecord | undefined {
    return this.#records.get(subjectKey(subject))
  }

  /** Every record, ordered by subject, so a listing never depends on data order. */
  list(): readonly CompatibilityRecord[] {
    return [...this.#records.values()].sort((left, right) =>
      subjectKey(left.subject).localeCompare(subjectKey(right.subject)),
    )
  }

  get size(): number {
    return this.#records.size
  }
}

/**
 * The seed, loaded through the same validation as any data.
 *
 * It is written as data in this package and re-validated at load, so a bad edit to
 * the seed fails the moment something reads it rather than the moment someone
 * trusts it.
 */
export function loadSeedRegistry(): CompatibilityRegistry {
  return new CompatibilityRegistry(parseRegistry(SEED_RECORDS))
}
