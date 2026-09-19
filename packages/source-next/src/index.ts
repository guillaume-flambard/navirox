import type { SourceAdapter } from '@memolabs-apps/source'
import { ADAPTER_ID, COMPOSES, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS, detect } from './detect.js'
import { buildGraph } from './graph.js'
import { inspect } from './inspect.js'

export const PACKAGE_NAME = '@memolabs-apps/source-next'

export const PACKAGE_ROLE =
  'The Next source adapter: detection, both routers, layouts, and the module boundary, on top of the React adapter.'

/**
 * The Next adapter.
 *
 * `experimental`, and it inherits the refusal the React adapter makes: a project
 * already aimed at the native surface is not a source. The three adapters that
 * compose another make the composition a pattern rather than a coincidence, and
 * this is the third.
 */
export function createNextAdapter(): SourceAdapter {
  return {
    id: ADAPTER_ID,
    displayName: DISPLAY_NAME,
    supportLevel: 'experimental',
    composes: COMPOSES,
    testedVersions: [{ framework: FRAMEWORK, versions: TESTED_VERSIONS }],
    detect,
    inspect,
    buildGraph,
  }
}

export { ADAPTER_ID, COMPOSES, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS, detect } from './detect.js'
export { DIRECTIVE_PATTERN, declaredBoundary, isAppRouterFile } from './boundary.js'
export {
  APP_DIRS,
  APP_LAYOUT,
  APP_PAGE,
  PAGES_DIRS,
  isPageOrLayout,
  isServerSurface,
  readRoutes,
  urlPattern,
} from './routes.js'
export type { FindingDraft, RouteReading } from './routes.js'
export { buildGraph } from './graph.js'
export { inspect } from './inspect.js'
