import type { AppGraph, FindingSeverity, SourceDescriptor } from '@memolabs-apps/graph'
import type { SupportLevel } from '@memolabs-apps/source'

/** The report schema version. A reader decides it can read a report with this. */
export const INSPECT_REPORT_SCHEMA_VERSION = 1

/** What was found, counted. A consumer should not have to walk the graph for this. */
export interface InspectionSummary {
  /** Project source files that were read, after the ignored directories were skipped. */
  readonly files: number
  readonly units: number
  readonly capabilities: number
  readonly dependencies: number
  readonly routes: number
  readonly screens: number
  readonly findings: Readonly<Record<FindingSeverity, number>>
}

/**
 * The versioned report.
 *
 * It carries the graph itself rather than a rendering of it, so the same report
 * serves a person and a future consumer such as a migration planner.
 */
export interface InspectReport {
  readonly schemaVersion: number
  readonly rootDir: string
  readonly source: SourceDescriptor
  /** How far the adapter is trusted. Carried so a report never reads as more than it is. */
  readonly supportLevel: SupportLevel
  readonly summary: InspectionSummary
  readonly graph: AppGraph
}

/** Why an inspection did not produce a report. */
export type InspectFailureReason =
  'no-adapter' | 'ambiguous-adapter' | 'unknown-adapter' | 'adapter-failed'

/**
 * The outcome, as data.
 *
 * A failure is a value rather than an exception because "this directory has no
 * adapter" is an answer the command line turns into a message and an exit code,
 * and an exception would make that a special case at every call site.
 */
export type InspectOutcome =
  | { readonly ok: true; readonly report: InspectReport }
  | {
      readonly ok: false
      readonly reason: InspectFailureReason
      readonly message: string
      /** Adapter ids that are registered, for a caller that asked for one that is not. */
      readonly available: readonly string[]
    }
