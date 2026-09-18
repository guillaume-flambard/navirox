import type { SourceAdapter } from '@navirox/source'
import { ADAPTER_ID, COMPOSES, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS, detect } from './detect.js'
import { buildGraph, inspect } from './inspect.js'

export const PACKAGE_NAME = '@navirox/source-sveltekit'

export const PACKAGE_ROLE =
  'The SvelteKit source adapter: detection, filesystem route extraction, and App Graph construction on top of the Svelte adapter.'

/**
 * The SvelteKit adapter.
 *
 * It declares that it composes the Svelte adapter, which is what makes the
 * registry select it over that adapter. Everything else it claims is the same
 * `experimental` claim the other adapters make, for the same reason: it reads,
 * it does not transform.
 */
export function createSvelteKitAdapter(): SourceAdapter {
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
  NON_PAGE_FILES,
  PAGE_FILE,
  ROUTES_DIR,
  isRoutePath,
  readRoutes,
  routePattern,
} from './routes.js'
export type { FindingDraft } from './routes.js'
export { routeFindings } from './findings.js'
export { buildGraph, inspect } from './inspect.js'
