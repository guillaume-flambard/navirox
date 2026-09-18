import type { SourceAdapter } from '@navirox/source'

import { ADAPTER_ID, COMPOSES, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS, detect } from './detect.js'
import { buildGraph } from './graph.js'
import { inspect } from './inspect.js'

export const PACKAGE_NAME = '@navirox/source-astro'
export const PACKAGE_ROLE =
  'The Astro source adapter: pages, islands, and the framework components it hands to the adapters that read them.'

/**
 * Astro is the first adapter that composes more than one framework, because a
 * single Astro page can hold a Vue component, a Svelte component and a React
 * component at once, and the file that composes them is the Astro one. The
 * adapter reads the container, the routes and the server surface, and hands each
 * island's component to the adapter that knows its framework.
 */
export function createAstroAdapter(): SourceAdapter {
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
export {
  FRAMEWORK_INTEGRATIONS,
  HYDRATION_DIRECTIVES,
  JSX_FRAMEWORKS,
  READABLE_FRAMEWORKS,
  readIntegrations,
  readIslands,
  resolveImport,
} from './islands.js'
export type { IslandReading, IslandReadingResult } from './islands.js'
export {
  ENDPOINT_EXTENSIONS,
  PAGES_DIR,
  PAGE_EXTENSIONS,
  isExcluded,
  isServerSurface,
  pageSegments,
  readRoutes,
  urlPattern,
} from './routes.js'
export type { FindingDraft, RouteReading } from './routes.js'
export { buildGraph } from './graph.js'
export { inspect } from './inspect.js'
