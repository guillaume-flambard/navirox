/** Canonical npm name of this package. Kept in code so the import
 *  boundary checks can assert against it without reading package.json. */
export const PACKAGE_NAME = 'create-navirox'

/** One line describing this package's role in the Navirox stack. */
export const PACKAGE_ROLE = 'Scaffolder invoked by `npm create navirox`.'

export { HELP, runCli, parseArguments, UsageError, type ICliIo } from './cli.js'
export {
  scaffoldApp,
  TargetNotEmptyError,
  TemplateMissingError,
  TEMPLATE_DIRECTORY,
  type IScaffoldOptions,
  type IScaffoldResult,
} from './scaffold.js'
export { InvalidAppNameError, deriveNames, isValidDirName, type IAppNames } from './names.js'
