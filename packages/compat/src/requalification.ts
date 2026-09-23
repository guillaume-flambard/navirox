import { VersionMatrix, versionMatrixKey } from './version-matrix.js'

/**
 * The requalification protocol: what happens when an upstream major is
 * released.
 *
 * A new major opens a requalification; it never widens a range by itself.
 * The range widens only after every gate passes, which is a matrix edit with
 * its own evidence, not an automatic upgrade. Until then the refusal for the
 * new major stays deterministic.
 */

/** The gates a candidate major passes before a range may widen. */
export const REQUALIFICATION_GATES = [
  'corpus',
  'builds',
  'device-journeys',
  'captures',
  'matrix-update',
] as const

export type RequalificationGate = (typeof REQUALIFICATION_GATES)[number]

export type RequalificationStatus = 'open' | 'complete'

export interface RequalificationInput {
  readonly adapterId: string
  readonly framework: string
  readonly candidateMajor: number
  /** The fixture that pins the candidate major, with its lockfile. */
  readonly fixture: string
}

export interface Requalification {
  readonly adapterId: string
  readonly framework: string
  readonly candidateMajor: number
  readonly fixture: string
  readonly gates: readonly RequalificationGate[]
  readonly passed: readonly RequalificationGate[]
  readonly status: RequalificationStatus
}

export class RequalificationDataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RequalificationDataError'
  }
}

function verifiedMajors(matrix: VersionMatrix, adapterId: string, framework: string): number[] {
  const majors: number[] = []

  for (const range of matrix.verifiedRangesFor(adapterId, framework)) {
    const match = /\d+/.exec(range)

    if (match !== null) {
      majors.push(Number(match[0]))
    }
  }

  return majors
}

/**
 * Opens a requalification for an upstream major.
 *
 * The matrix is never mutated: the range stays exactly as it was, and the
 * caller gets a record of the gates the candidate must still pass. Opening a
 * requalification for a major the matrix already verifies is an error, because
 * there is nothing to requalify.
 */
export function openRequalification(
  matrix: VersionMatrix,
  input: RequalificationInput,
): Requalification {
  const rows = matrix.rowsFor(input.adapterId).filter((row) => row.framework === input.framework)

  if (rows.length === 0) {
    throw new RequalificationDataError(
      `No matrix row governs ${input.adapterId}:${input.framework} (${versionMatrixKey({ adapterId: input.adapterId, profile: input.framework })} has no match), so there is nothing to requalify.`,
    )
  }

  if (input.fixture.trim() === '') {
    throw new RequalificationDataError(
      `The requalification for ${input.framework} ${input.candidateMajor} names no fixture, so the candidate cannot be reproduced.`,
    )
  }

  if (verifiedMajors(matrix, input.adapterId, input.framework).includes(input.candidateMajor)) {
    throw new RequalificationDataError(
      `The matrix already verifies ${input.framework} ${input.candidateMajor} for ${input.adapterId}, so no requalification is needed.`,
    )
  }

  return {
    adapterId: input.adapterId,
    framework: input.framework,
    candidateMajor: input.candidateMajor,
    fixture: input.fixture,
    gates: REQUALIFICATION_GATES,
    passed: [],
    status: 'open',
  }
}
