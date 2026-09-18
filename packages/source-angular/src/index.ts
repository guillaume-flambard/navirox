import type { SourceAdapter } from '@navirox/source'
import { ADAPTER_ID, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS, detect } from './detect.js'
import { buildGraph } from './graph.js'
import { inspect } from './inspect.js'

export const PACKAGE_NAME = '@navirox/source-angular'

export const PACKAGE_ROLE =
  'The Angular source adapter: detection, decorator-driven component and service discovery, routes, and App Graph construction.'

/**
 * The Angular adapter.
 *
 * `experimental`, for the reasons the others give plus one of its own: a service's
 * state is decided by what the class holds rather than by a library, and that
 * reading is a judgement recorded in the evidence.
 */
export function createAngularAdapter(): SourceAdapter {
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

export { ADAPTER_ID, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS, detect } from './detect.js'
export { readDeclaration } from './decorators.js'
export type { AngularDeclaration } from './decorators.js'
export { ROUTES_FILE_PATTERN, isRoutesFile, readRoutes, routePattern } from './routes.js'
export type { FindingDraft, RouteReading } from './routes.js'
export { buildGraph } from './graph.js'
export { inspect } from './inspect.js'
