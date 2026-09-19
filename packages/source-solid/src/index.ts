import type { SourceAdapter } from '@memolabs-apps/source'
import { ADAPTER_ID, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS, detect } from './detect.js'
import { buildGraph } from './graph.js'
import { inspect } from './inspect.js'

export const PACKAGE_NAME = '@memolabs-apps/source-solid'

export const PACKAGE_ROLE =
  "The Solid source adapter: components, stores and the router's two declared shapes."

/**
 * The adapter a Solid project reaches Navirox through.
 *
 * It is `experimental` for the reasons every adapter gives, and for one of its
 * own: Solid's reactivity is a third model, neither the store Vue imports nor
 * the hook names React uses, and this adapter reads the state a module declares
 * rather than the signals inside it.
 */
export function createSolidAdapter(): SourceAdapter {
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
export { COMPONENT_EXTENSIONS, isComponentExtension, readDeclaration } from './components.js'
export type { SolidDeclaration } from './components.js'
export {
  ROUTES_FILE_PATTERN,
  hasWildcardSegment,
  isRoutesFile,
  readRoutes,
  routePattern,
} from './routes.js'
export type { FindingDraft, RouteReading } from './routes.js'
export { buildGraph } from './graph.js'
export { inspect } from './inspect.js'
