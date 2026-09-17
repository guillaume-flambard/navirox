/** Canonical npm name of this package. Kept in code so the import
 *  boundary checks can assert against it without reading package.json. */
export const PACKAGE_NAME = '@navirox/cli'

/** One line describing this package's role in the Navirox stack. */
export const PACKAGE_ROLE = 'The `navirox` command line interface.'

export { HELP, parseArguments, UsageError, type IParsedArguments, type TPlatform } from './args.js'
export { runCli, type ICliIo } from './cli.js'
export {
  createDevContext,
  detectPackageManager,
  runDev,
  type IDevContext,
  type IPackageManager,
  type IRunDevOptions,
} from './dev.js'
export {
  checkToolchain,
  createNodeProbe,
  findOnPath,
  missingRemedies,
  PreflightError,
  requiredTools,
  type ICheckResult,
  type IProbe,
  type IToolRequirement,
} from './preflight.js'
export {
  createNodeRunner,
  METRO_READY_TIMEOUT_MS,
  type IBackgroundProcess,
  type ICommand,
  type IDevIo,
  type IRunner,
} from './runner.js'
