/**
 * The record of where a proof companion's files came from, and the rule that a
 * generated file may not be passed off as one.
 *
 * A companion mixes three kinds of file: output the target compiler produced,
 * units the planner approved as portable or shared and that were copied
 * unchanged, and files a person wrote. Without a record a hand-written screen
 * is indistinguishable from generated output, so the record is built here and
 * every entry has to name its origin and a reason. A generated entry is also
 * checked against a fresh compilation, so a drifted screen stops the run
 * instead of shipping a companion that no longer matches its source.
 */

import {
  compileFixtureScreen,
  type FixtureScreenCompilation,
  type FixtureScreenOptions,
} from './fixture-screen.js'

export const COMPANION_PROVENANCE_SCHEMA_VERSION = 1

/** Where a companion file came from. */
export type CompanionFileOrigin = 'generated' | 'moved' | 'manual'

export interface CompanionFileEntry {
  readonly path: string
  readonly origin: CompanionFileOrigin
  /**
   * Why the file is in the companion. For a moved unit this is the reason the
   * planner gave, and for a manual file it is the reason it had to be written.
   */
  readonly reason: string
  /** Moved entries only: the planner decision that approved the move. */
  readonly decision?: string
  /** Moved entries only: the source path the file was copied from. */
  readonly sourcePath?: string
  /**
   * Moved entries only: the content hash of the bytes that moved. Without it a
   * reviewer cannot tell what travelled, and an edit to the unit would leave
   * every other check green.
   */
  readonly sha256?: string
}

export interface CompanionProvenance {
  readonly schemaVersion: number
  readonly fixture: string
  readonly compilerVersion: string
  readonly manifestHash: string
  /**
   * Path of the screen inside the companion. It is compiler output on a journey
   * with a target compiler and hand-written work on a journey without one, and
   * the entry that names it says which.
   */
  readonly screen: string
  readonly files: readonly CompanionFileEntry[]
}

export interface CompanionProvenanceInput {
  readonly fixture: string
  readonly compilerVersion: string
  readonly manifestHash: string
  readonly screen: string
  readonly files: readonly CompanionFileEntry[]
}

export interface CompanionScreenRefreshOptions extends FixtureScreenOptions {
  readonly provenance: CompanionProvenance
}

const ORIGINS: readonly CompanionFileOrigin[] = ['generated', 'moved', 'manual']

export class CompanionProvenanceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CompanionProvenanceError'
  }
}

function nonEmpty(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Builds the record, refusing any entry that would hide where a file came from.
 * The screen has to be named, as compiler output or as hand-written work, a
 * moved entry has to name the planner decision that approved it and the hash of
 * the bytes that moved, and every entry has to give a reason.
 */
export function buildCompanionProvenance(input: CompanionProvenanceInput): CompanionProvenance {
  if (!nonEmpty(input.fixture)) {
    throw new CompanionProvenanceError('The provenance names no fixture.')
  }

  if (input.files.length === 0) {
    throw new CompanionProvenanceError('The provenance names no file.')
  }

  const seen = new Set<string>()

  for (const file of input.files) {
    if (!nonEmpty(file.path)) {
      throw new CompanionProvenanceError('A companion file entry has no path.')
    }

    if (seen.has(file.path)) {
      throw new CompanionProvenanceError(`The provenance names ${file.path} twice.`)
    }

    seen.add(file.path)

    if (!ORIGINS.includes(file.origin)) {
      throw new CompanionProvenanceError(
        `${file.path} names the origin "${file.origin}", which is not generated, moved or manual.`,
      )
    }

    if (!nonEmpty(file.reason)) {
      throw new CompanionProvenanceError(
        `${file.path} names no reason, so a reviewer cannot tell why it is here.`,
      )
    }

    if (file.origin === 'moved' && !nonEmpty(file.decision)) {
      throw new CompanionProvenanceError(
        `${file.path} is moved but names no planner decision, so the move is unsupported.`,
      )
    }

    if (file.origin === 'moved' && !nonEmpty(file.sha256)) {
      throw new CompanionProvenanceError(
        `${file.path} is moved but names no content hash, so a reviewer cannot tell what bytes moved.`,
      )
    }
  }

  const screen = input.files.find((file) => file.path === input.screen)

  if (screen === undefined) {
    throw new CompanionProvenanceError(
      `The screen ${input.screen} is not named in the record, so a reviewer cannot tell what the companion shows.`,
    )
  }

  if (screen.origin === 'moved') {
    throw new CompanionProvenanceError(
      `The screen ${input.screen} is marked moved, but a screen is either compiler output or hand-written work.`,
    )
  }

  return {
    schemaVersion: COMPANION_PROVENANCE_SCHEMA_VERSION,
    fixture: input.fixture,
    compilerVersion: input.compilerVersion,
    manifestHash: input.manifestHash,
    screen: input.screen,
    files: input.files.map((file) => ({ ...file })),
  }
}

/** Stable serialization, so the committed record does not churn. */
export function serializeCompanionProvenance(provenance: CompanionProvenance): string {
  return `${JSON.stringify(provenance, undefined, 2)}\n`
}

/**
 * Compiles the fixture again and refuses a generated screen whose fresh output
 * no longer matches the emitted file. The provenance is read first so a record
 * that does not name a generated screen is rejected before compiling, and
 * the existing fixture rule does the byte comparison.
 */
export async function refreshCompanionScreen(
  options: CompanionScreenRefreshOptions,
): Promise<FixtureScreenCompilation> {
  const generated = options.provenance.files.filter((file) => file.origin === 'generated')
  const screen = generated.find((file) => file.path === options.outputPath)

  if (screen === undefined) {
    throw new CompanionProvenanceError(
      `The provenance names no generated file at ${options.outputPath}, so there is nothing to refresh.`,
    )
  }

  return compileFixtureScreen(options)
}
