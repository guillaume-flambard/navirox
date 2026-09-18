import type { SourceAdapter } from '@navirox/source'
import { ADAPTER_ID, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS, detect } from './detect.js'
import { buildGraph } from './graph.js'
import { inspect } from './inspect.js'

export const PACKAGE_NAME = '@navirox/source-qwik'

export const PACKAGE_ROLE =
  'The Qwik source adapter: resumable component boundaries, Qwik City routes, and the surface the adapter reports rather than reads.'

/**
 * The Qwik adapter.
 *
 * `experimental`, for the reasons every adapter gives plus one of its own: a
 * Qwik component is a lazy boundary rather than a call, so what a module
 * declares is read as the boundary it is and never as a store, because Qwik
 * documents no store module to import.
 */
export function createQwikAdapter(): SourceAdapter {
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
export type { QwikDeclaration } from './components.js'
export {
  ENDPOINT_EXTENSION,
  LAYOUT_PREFIX,
  NOT_FOUND_FILE,
  NOT_MODELLED_CODES,
  PAGE_EXTENSIONS,
  PLUGIN_PREFIX,
  ROUTES_DIR,
  REWRITE_CONFIG_FILES,
  ROUTE_REWRITE_DECLARATION,
  isRoutesFile,
  readRoutes,
  urlPattern,
} from './routes.js'
export type { FindingDraft, LayoutDraft, RouteReading } from './routes.js'
export { buildGraph } from './graph.js'
export { inspect } from './inspect.js'
