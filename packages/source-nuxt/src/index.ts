import type { SourceAdapter } from '@memolabs-apps/source'
import { ADAPTER_ID, COMPOSES, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS, detect } from './detect.js'
import { buildGraph, inspect } from './inspect.js'

export const PACKAGE_NAME = '@memolabs-apps/source-nuxt'

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
  APP_CONFIG_FILES,
  APP_DIR,
  APP_PAGES_DIR,
  CLIENT_COMPONENT_SUFFIX,
  CONFIG_FILES,
  LAYOUTS_DIRS,
  PAGES_DIR,
  PAGES_DIRS,
  SERVER_COMPONENT_SUFFIX,
  SERVER_SURFACE,
  pagePattern,
  paramsOf,
  readModuleRoutes,
  readPageMetadata,
  readRoutes,
  readUnits,
  readUnmodelled,
} from './conventions.js'
export type { FindingDraft, PageMetadata, PageReading } from './conventions.js'
export { buildGraph, inspect } from './inspect.js'
