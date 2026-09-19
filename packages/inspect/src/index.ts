/** Canonical npm name of this package. Kept in code so the import
 *  boundary checks can assert against it without reading package.json. */
export const PACKAGE_NAME = '@memolabs-apps/inspect'

/** One line describing this package's role in the Navirox stack. */
export const PACKAGE_ROLE =
  'The framework-neutral inspection pipeline: adapter selection, App Graph assembly and the versioned report.'

export { runInspection } from './inspect.js'
export type { InspectOptions } from './inspect.js'
export { renderFailure, renderReport, reportToJson } from './render.js'
export { INSPECT_REPORT_SCHEMA_VERSION } from './types.js'
export type {
  InspectFailureReason,
  InspectOutcome,
  InspectReport,
  InspectionSummary,
} from './types.js'
