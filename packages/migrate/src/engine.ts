import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import type { AppGraph, NodeId } from '@memolabs-apps/graph'
import type { MigrationPlan } from '@memolabs-apps/planner'
import {
  importSpecifiers,
  isRelativeSpecifier,
  packageNameOf,
  resolveRelativeSpecifier,
} from './imports.js'
import {
  MIGRATION_STATE_SCHEMA_VERSION,
  fingerprintOf,
  type MigrationState,
  type UnitMigrationState,
  serializeState,
} from './state.js'
import { GENERIC_TRANSFORMS, type Transform, type TransformWrite } from './transforms.js'
import { TRANSFORM_FAMILIES } from './transforms.js'

/**
 * The engine.
 *
 * Three properties, in this order. It does not write unless it was told to, and a
 * dry run is what happens by default. It writes nowhere but the output directory
 * it was given. And a run that fails puts back everything it touched, because the
 * unit of undo is the run the user just started rather than the whole history.
 */

export class MigrationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MigrationError'
  }
}

export interface MigrationOptions {
  readonly graph: AppGraph
  readonly plan: MigrationPlan
  readonly adapterId: string
  readonly sourceRoot: string
  readonly outputRoot: string
  /** False means a dry run, which is the default everywhere this is called. */
  readonly write?: boolean
  readonly readText: (path: string) => string | undefined
  readonly state?: MigrationState
  readonly transforms?: readonly Transform[]
}

export interface PlannedWrite {
  readonly unit: NodeId
  readonly transform: string
  readonly from: string
  readonly to: string
}

export interface SkippedUnit {
  readonly unit: NodeId
  readonly reason: string
}

/**
 * An import a moved unit names that this run did not carry.
 *
 * A copy leaves the manual work behind it in the open rather than hiding it: the
 * moved file is written, and this says what a person still has to do.
 */
export interface UnresolvedImport {
  readonly unit: NodeId
  readonly file: string
  readonly specifier: string
  readonly reason: string
}

export interface MigrationReport {
  readonly schemaVersion: number
  readonly dryRun: boolean
  readonly files: readonly PlannedWrite[]
  readonly moved: readonly NodeId[]
  readonly skipped: readonly SkippedUnit[]
  readonly unresolved: readonly UnresolvedImport[]
  readonly restored: readonly string[]
  /** The state as it would be after this run, which the caller may persist. */
  readonly state: MigrationState
}

interface Held {
  readonly path: string
  readonly previous: string | undefined
}

function isInside(root: string, candidate: string): boolean {
  const path = relative(root, candidate)

  return path.length > 0 && !path.startsWith(`..${sep}`) && path !== '..' && !path.startsWith(sep)
}

/** Resolves a target path and refuses anything outside the output directory. */
function targetFor(outputRoot: string, relativePath: string): string {
  const target = resolve(outputRoot, relativePath)

  if (!isInside(outputRoot, target)) {
    throw new MigrationError(
      `A transform wanted to write ${relativePath}, which resolves outside the output directory. Nothing was written.`,
    )
  }

  return target
}

export function runMigration(options: MigrationOptions): MigrationReport {
  const outputRoot = resolve(options.outputRoot)
  const sourceRoot = resolve(options.sourceRoot)

  if (outputRoot === sourceRoot) {
    throw new MigrationError(
      'The output directory is the source directory. This engine migrates into a separate directory and does not rewrite a project in place.',
    )
  }

  const transforms = [...(options.transforms ?? GENERIC_TRANSFORMS)].sort(
    (left, right) =>
      TRANSFORM_FAMILIES.indexOf(left.family) - TRANSFORM_FAMILIES.indexOf(right.family),
  )
  const decisions = new Map(options.plan.decisions.map((decision) => [decision.subject, decision]))
  const previous: Readonly<Record<string, UnitMigrationState>> = options.state?.units ?? {}
  const files: PlannedWrite[] = []
  const moved: NodeId[] = []
  const skipped: SkippedUnit[] = []
  const movedUnits = new Map<NodeId, { readonly file: string; readonly content: string }>()
  const units: Record<string, UnitMigrationState> = { ...previous }
  const declaredDependencies = new Set(
    options.graph.dependencies.map((dependency) => dependency.name),
  )
  const writes: {
    readonly write: TransformWrite
    readonly target: string
    readonly unit: NodeId
    readonly transform: string
  }[] = []

  for (const unit of options.graph.units) {
    const decision = decisions.get(unit.id)

    if (decision === undefined) {
      skipped.push({ unit: unit.id, reason: 'the plan decided nothing about it' })
      continue
    }

    const content = options.readText(unit.source.file)

    if (content === undefined) {
      skipped.push({ unit: unit.id, reason: 'its file could not be read' })
      continue
    }

    const fingerprint = fingerprintOf(content)
    const done = previous[unit.id]

    if (done !== undefined && done.fingerprint === fingerprint) {
      skipped.push({ unit: unit.id, reason: 'already migrated at this content' })
      continue
    }

    // Every transform that applies runs, in family order, so a unit can be read by
    // a source transform, then a generic one, then a target one, and none of them
    // silently replaces another.
    const ran: string[] = []
    let firstOutput: string | undefined

    for (const transform of transforms) {
      if (!transform.applies({ unit, decision, readText: options.readText })) {
        continue
      }

      const planned = transform.write({ unit, decision, readText: options.readText })

      for (const write of planned) {
        const target = targetFor(outputRoot, write.relativePath)

        writes.push({ write, target, unit: unit.id, transform: transform.id })
        files.push({
          unit: unit.id,
          transform: transform.id,
          from: write.from,
          to: write.relativePath,
        })
        firstOutput ??= write.relativePath
      }

      ran.push(transform.id)
    }

    if (ran.length === 0) {
      skipped.push({
        unit: unit.id,
        reason: `no transform applies, and the plan called it ${decision.classification}`,
      })
      continue
    }

    if (firstOutput === undefined) {
      skipped.push({ unit: unit.id, reason: 'the transforms that apply produced no output for it' })
      continue
    }

    moved.push(unit.id)
    movedUnits.set(unit.id, { file: unit.source.file, content })
    units[unit.id] = { fingerprint, output: firstOutput, transforms: ran }
  }

  const nextState: MigrationState = {
    schemaVersion: MIGRATION_STATE_SCHEMA_VERSION,
    adapterId: options.adapterId,
    outputRoot,
    units,
  }

  const report: MigrationReport = {
    schemaVersion: MIGRATION_STATE_SCHEMA_VERSION,
    dryRun: options.write !== true,
    files,
    moved,
    skipped,
    unresolved: collectUnresolved(movedUnits, declaredDependencies, options.readText),
    restored: [],
    state: nextState,
  }

  if (options.write !== true) {
    return report
  }

  const held: Held[] = []
  let current: { readonly unit: NodeId; readonly transform: string } | undefined

  try {
    for (const entry of writes) {
      current = { unit: entry.unit, transform: entry.transform }
      held.push({ path: entry.target, previous: readIfPresent(entry.target) })
      mkdirSync(dirname(entry.target), { recursive: true })
      writeFileSync(entry.target, entry.write.content)
    }
  } catch (error) {
    const restored = restore(held)
    const message = error instanceof Error ? error.message : String(error)
    const where =
      current === undefined
        ? 'before any file was written'
        : `${current.transform} on ${current.unit}`

    throw new MigrationError(
      `The run failed in ${where}, and ${restored.length} file(s) were restored: ${restored.join(', ')}. Cause: ${message}`,
    )
  }

  // The record is written last, after the files it describes exist. State that runs
  // ahead of reality is worse than no state, because the next run trusts it.
  try {
    const statePath = join(outputRoot, STATE_FILE)
    mkdirSync(dirname(statePath), { recursive: true })
    writeFileSync(statePath, serializeState(nextState))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    throw new MigrationError(
      `The files were written, and the migration state could not be recorded: ${message}. The next run will not know about this one.`,
    )
  }

  return report
}

/** Where the record lives, inside the output directory it describes. */
export const STATE_FILE = '.navirox/migration.json'

/**
 * What the units this run moved still need.
 *
 * A relative specifier is carried when it resolves to another file this run moved.
 * A bare specifier is carried when the project declares its package, because the
 * manifest is what a native application installs. Everything else is manual work
 * the report names rather than hides.
 */
function collectUnresolved(
  movedUnits: ReadonlyMap<NodeId, { readonly file: string; readonly content: string }>,
  declared: ReadonlySet<string>,
  readText: (path: string) => string | undefined,
): readonly UnresolvedImport[] {
  const movedFiles = new Set([...movedUnits.values()].map((entry) => entry.file))
  const unresolved: UnresolvedImport[] = []

  for (const [unit, entry] of movedUnits) {
    for (const specifier of importSpecifiers(entry.content)) {
      if (isRelativeSpecifier(specifier)) {
        const resolved = resolveRelativeSpecifier(
          entry.file,
          specifier,
          (path) => readText(path) !== undefined,
        )

        if (resolved !== undefined && movedFiles.has(resolved)) {
          continue
        }

        unresolved.push({
          unit,
          file: entry.file,
          specifier,
          reason:
            resolved === undefined
              ? 'the file it names could not be found in the project'
              : 'the file it names was not moved by this run',
        })

        continue
      }

      if (declared.has(packageNameOf(specifier))) {
        continue
      }

      unresolved.push({
        unit,
        file: entry.file,
        specifier,
        reason: 'it is not relative and the project does not declare it as a dependency',
      })
    }
  }

  return unresolved
}

function readIfPresent(path: string): string | undefined {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return undefined
  }
}

/** Puts every file this run touched back the way it was. */
function restore(held: readonly Held[]): readonly string[] {
  const restored: string[] = []

  for (const entry of [...held].reverse()) {
    try {
      if (entry.previous === undefined) {
        rmSync(entry.path, { force: true })
      } else {
        writeFileSync(entry.path, entry.previous)
      }

      restored.push(entry.path)
    } catch {
      // A restore that cannot happen is reported by omission rather than by
      // replacing the original failure with a second one.
    }
  }

  return restored
}
