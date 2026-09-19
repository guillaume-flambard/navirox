import type { SourceAdapter } from '@memolabs-apps/source'
import { ADAPTER_ID, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS, detect } from './detect.js'
import { buildGraph } from './graph.js'
import { inspect } from './inspect.js'

export const PACKAGE_NAME = '@memolabs-apps/source-react'

export const PACKAGE_ROLE =
  'The React source adapter: detection, function component and state module discovery, router configuration, and App Graph construction.'

/**
 * The React adapter.
 *
 * `experimental`, and the one adapter whose detection refuses a whole class of
 * project: a React Native application is the target, not a web source. Reading one
 * as a source is the confusion the architecture forbids, so it is refused by rule
 * rather than left to the caller.
 */
export function createReactAdapter(): SourceAdapter {
  return {
    id: ADAPTER_ID,
    displayName: DISPLAY_NAME,
    supportLevel: 'experimental',
    testedVersions: [{ framework: FRAMEWORK, versions: TESTED_VERSIONS }],
    detect,
    inspect,
    buildGraph,
  }
}

export {
  ADAPTER_ID,
  DISPLAY_NAME,
  FRAMEWORK,
  NATIVE_PREFIXES,
  NATIVE_RUNTIME,
  TESTED_VERSIONS,
  declaredNames,
  detect,
  nativeDeclarations,
} from './detect.js'
export { COMPONENT_EXTENSIONS, isComponentExtension, readDeclaration } from './components.js'
export type { ReactDeclaration } from './components.js'
export { ROUTES_FILE_PATTERN, isRoutesFile, readRoutes, routePattern } from './routes.js'
export type { FindingDraft, RouteReading } from './routes.js'
export { buildGraph } from './graph.js'
export { inspect } from './inspect.js'
