import { EVIDENCE_LEVELS } from './types.js'
import type { EvidenceLevel } from './types.js'

/**
 * The evidenced compatibility matrix: which framework versions a
 * transformation profile may claim.
 *
 * A framework name in a manifest is not a compatibility claim, and neither is
 * a declared npm range. A claim is a row here, with a verified version range,
 * the topology it was verified on, the plugins and configs it admits, the
 * constructs it covers, the escape hatches it leaves, the target profiles it
 * may emit to, the evidence behind it and the gate that evidence passed.
 * Anything outside a row is refused, never downgraded.
 */

/** The matrix schema version. */
export const VERSION_MATRIX_SCHEMA_VERSION = 1

/** The support gates a row can claim to have passed. Only T6 means supported. */
export const VERSION_MATRIX_GATES = ['T0', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6'] as const

export type VersionMatrixGate = (typeof VERSION_MATRIX_GATES)[number]

/**
 * The deterministic refusal an adapter returns for an unverified version.
 *
 * It names the fact, its location, the expected profile and a resumption path,
 * and no application is generated alongside it.
 */
export const OUTSIDE_VERIFIED_RANGE = 'outside-verified-range'

export interface VersionMatrixEvidence {
  readonly level: EvidenceLevel
  /** Where the demonstration lives: a fixture, a run, a build. */
  readonly source: string
}

export interface VersionMatrixRow {
  /** The adapter id that owns this profile, e.g. `vue`. */
  readonly adapterId: string
  /** The transformation profile this row governs, e.g. `vue-single-file-component`. */
  readonly profile: string
  /** The framework package this row verifies, e.g. `vue` or `@angular/core`. */
  readonly framework: string
  /** The version ranges actually exercised, as written, never resolved. */
  readonly verifiedVersions: readonly string[]
  /** The repository topologies this row was verified on. */
  readonly topologyProfiles: readonly string[]
  /** The plugins a project may declare and still be covered by this row. */
  readonly admittedPlugins: readonly string[]
  /** The config files a project may carry and still be covered by this row. */
  readonly admittedConfigs: readonly string[]
  /** The constructs this row covers. Anything else is refused or manual. */
  readonly coveredConstructs: readonly string[]
  /** The declared ways out: findings and diagnostics this row may produce. */
  readonly escapeHatches: readonly string[]
  /** The target profiles this row may emit to. Empty until a target is proven. */
  readonly targetProfiles: readonly string[]
  readonly evidence: readonly VersionMatrixEvidence[]
  readonly gate: VersionMatrixGate
}

/** The key a row is looked up and indexed by. */
export function versionMatrixKey(row: Pick<VersionMatrixRow, 'adapterId' | 'profile'>): string {
  return `${row.adapterId}:${row.profile}`
}

export class VersionMatrixDataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'VersionMatrixDataError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringList(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function parseEvidence(value: unknown, where: string): void {
  if (!Array.isArray(value) || value.length === 0) {
    throw new VersionMatrixDataError(`${where} declares no evidence, so nothing supports it.`)
  }

  for (const entry of value) {
    if (!isRecord(entry)) {
      throw new VersionMatrixDataError(`${where} has an evidence entry that is not an object.`)
    }

    if (!EVIDENCE_LEVELS.includes(entry['level'] as never)) {
      throw new VersionMatrixDataError(
        `${where} has an evidence level outside the declared set: ${String(entry['level'])}.`,
      )
    }

    if (typeof entry['source'] !== 'string' || entry['source'].length === 0) {
      throw new VersionMatrixDataError(`${where} has an evidence entry that names no source.`)
    }
  }
}

function parseRow(value: unknown, index: number): VersionMatrixRow {
  const where = `matrix row ${index}`

  if (!isRecord(value)) {
    throw new VersionMatrixDataError(`${where} is not an object.`)
  }

  if (typeof value['adapterId'] !== 'string' || value['adapterId'].length === 0) {
    throw new VersionMatrixDataError(`${where} names no adapter, so no adapter can read it.`)
  }

  if (typeof value['profile'] !== 'string' || value['profile'].length === 0) {
    throw new VersionMatrixDataError(`${where} names no profile, so nothing is governed.`)
  }

  if (typeof value['framework'] !== 'string' || value['framework'].length === 0) {
    throw new VersionMatrixDataError(`${where} names no framework, so no version can be checked.`)
  }

  if (
    !isStringList(value['verifiedVersions']) ||
    value['verifiedVersions'].length === 0 ||
    value['verifiedVersions'].some((version) => version.trim() === '')
  ) {
    throw new VersionMatrixDataError(
      `${where} names no verified version, so a declared npm range alone would look like a claim.`,
    )
  }

  for (const field of [
    'topologyProfiles',
    'admittedPlugins',
    'admittedConfigs',
    'coveredConstructs',
    'escapeHatches',
    'targetProfiles',
  ] as const) {
    if (!isStringList(value[field])) {
      throw new VersionMatrixDataError(
        `${where} has no ${field} list, so the profile boundary cannot be audited.`,
      )
    }
  }

  if (!VERSION_MATRIX_GATES.includes(value['gate'] as never)) {
    throw new VersionMatrixDataError(
      `${where} has a gate outside the declared set: ${String(value['gate'])}.`,
    )
  }

  parseEvidence(value['evidence'], where)

  return value as unknown as VersionMatrixRow
}

/** Parses matrix data, refusing anything a reader would have to take on trust. */
export function parseVersionMatrix(data: unknown): readonly VersionMatrixRow[] {
  if (!Array.isArray(data)) {
    throw new VersionMatrixDataError('The version matrix data is not a list of rows.')
  }

  return data.map((entry, index) => parseRow(entry, index))
}

export class VersionMatrix {
  readonly #rows: Map<string, VersionMatrixRow>

  constructor(rows: readonly VersionMatrixRow[]) {
    this.#rows = new Map()

    for (const row of rows) {
      this.#rows.set(versionMatrixKey(row), row)
    }
  }

  /** Every row for an adapter, ordered by key, so a listing never depends on data order. */
  rowsFor(adapterId: string): readonly VersionMatrixRow[] {
    return this.list().filter((row) => row.adapterId === adapterId)
  }

  /** The verified ranges one adapter claims for one framework package. */
  verifiedRangesFor(adapterId: string, framework: string): readonly string[] {
    return this.rowsFor(adapterId)
      .filter((row) => row.framework === framework)
      .flatMap((row) => row.verifiedVersions)
  }

  /** Every row, ordered by key. */
  list(): readonly VersionMatrixRow[] {
    return [...this.#rows.values()].sort((left, right) =>
      versionMatrixKey(left).localeCompare(versionMatrixKey(right)),
    )
  }

  get size(): number {
    return this.#rows.size
  }
}
