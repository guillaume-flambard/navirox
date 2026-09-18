import type { SourceAdapter } from '@navirox/source'
import { ADAPTER_ID, COMPOSES, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS, detect } from './detect.js'
import { buildGraph, inspect } from './inspect.js'

export const PACKAGE_NAME = '@navirox/source-nuxt'

export const PACKAGE_ROLE =
  'The Nuxt source adapter: detection, filesystem routes, layouts and composables, on top of the Vue adapter.'

/**
 * The Nuxt adapter.
 *
 * `experimental`, for the reasons the other adapters give plus one of its own:
 * the server side is a different runtime and it is reported rather than read.
 */
export function createNuxtAdapter(): SourceAdapter {
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
  ALT_PAGES_DIR,
  COMPOSABLES_DIRS,
  CONFIG_FILES,
  LAYOUTS_DIRS,
  PAGES_DIR,
  SERVER_SURFACE,
  pagePattern,
  readRoutes,
  readUnits,
  readUnmodelled,
} from './conventions.js'
export { buildGraph, inspect } from './inspect.js'
