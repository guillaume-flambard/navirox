export { createNodeCommandProbe } from './commands.js'
export type { ICommandProbe, ICommandResult } from './commands.js'

export { createDoctorDeps, exitCodeFor, hostPlatform, runDoctor } from './doctor.js'
export type {
  IDoctorCheck,
  IDoctorDeps,
  IDoctorReport,
  IDoctorSection,
  IRunDoctorOptions,
  TSectionId,
  TStatus,
} from './doctor.js'

export { renderReport, reportToJson, summarise } from './render.js'

export {
  checkToolchain,
  createNodeProbe,
  findOnPath,
  missingRemedies,
  PreflightError,
  requiredTools,
} from './toolchain.js'
export type {
  ICheckOptions,
  ICheckResult,
  IProbe,
  IToolRequirement,
  TPlatform,
} from './toolchain.js'

/** The package name, so tooling can assert what it is looking at. */
export const PACKAGE_NAME = '@memolabs-apps/doctor'

/** One line on what this package is for. */
export const PACKAGE_ROLE = 'Environment and dependency diagnostics behind `navirox doctor`.'
