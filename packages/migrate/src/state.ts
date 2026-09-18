import { createHash } from 'node:crypto'

/**
 * The migration state.
 *
 * It answers one question: for this unit, at this content, has the work already
 * been done. A timestamp cannot answer it, because a timestamp does not know
 * whether the thing it describes is still the thing it described. A fingerprint of
 * the content can, and that is what makes a second run a no-op instead of a
 * duplicate.
 *
 * The state is written after the files it describes, never before. State that runs
 * ahead of reality is worse than no state, because the next run trusts it.
 */

export const MIGRATION_STATE_SCHEMA_VERSION = 1

export interface UnitMigrationState {
  /** Fingerprint of the source content this unit was migrated at. */
  readonly fingerprint: string
  /** The path the unit was written to, relative to the output root. */
  readonly output: string
  /** The transforms that produced it, in the order they ran. */
  readonly transforms: readonly string[]
}

export interface MigrationState {
  readonly schemaVersion: number
  readonly adapterId: string
  readonly outputRoot: string
  readonly units: Readonly<Record<string, UnitMigrationState>>
}

export class MigrationStateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MigrationStateError'
  }
}

/** A short, deterministic fingerprint of a unit's content. */
export function fingerprintOf(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex').slice(0, 16)
}

export function emptyState(adapterId: string, outputRoot: string): MigrationState {
  return {
    schemaVersion: MIGRATION_STATE_SCHEMA_VERSION,
    adapterId,
    outputRoot,
    units: {},
  }
}

/** Parses state, refusing a version it does not know rather than guessing. */
export function parseState(text: string): MigrationState {
  let data: unknown

  try {
    data = JSON.parse(text)
  } catch {
    throw new MigrationStateError('The migration state is not valid JSON.')
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new MigrationStateError('The migration state is not an object.')
  }

  const state = data as Partial<MigrationState>

  if (state.schemaVersion !== MIGRATION_STATE_SCHEMA_VERSION) {
    throw new MigrationStateError(
      `The migration state declares schema version ${String(state.schemaVersion)}, and this tool reads ${MIGRATION_STATE_SCHEMA_VERSION}. It was not written by a version this tool understands.`,
    )
  }

  if (typeof state.adapterId !== 'string' || typeof state.outputRoot !== 'string') {
    throw new MigrationStateError('The migration state does not name its adapter and its target.')
  }

  return {
    schemaVersion: MIGRATION_STATE_SCHEMA_VERSION,
    adapterId: state.adapterId,
    outputRoot: state.outputRoot,
    units: state.units ?? {},
  }
}

export function serializeState(state: MigrationState): string {
  const units = Object.fromEntries(
    Object.entries(state.units).sort(([left], [right]) => left.localeCompare(right)),
  )

  return `${JSON.stringify({ ...state, units }, null, 2)}\n`
}
