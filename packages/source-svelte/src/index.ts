import type { SourceAdapter } from '@memolabs-apps/source'
import { ADAPTER_ID, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS, detect } from './detect.js'
import { buildGraph } from './graph.js'
import { inspect } from './inspect.js'

export const PACKAGE_NAME = '@memolabs-apps/source-svelte'

export const PACKAGE_ROLE =
  'The Svelte source adapter: detection, component inspection, and App Graph construction for an existing Svelte application.'

/**
 * The Svelte adapter.
 *
 * `experimental` again, for a shorter list of reasons than the Vue adapter has:
 * a component is read rather than compiled, routes belong to SvelteKit, and no
 * migration transform exists.
 */
export function createSvelteAdapter(): SourceAdapter {
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
export { UNMODELLED_PATTERNS, scanUnmodelled } from './unmodelled.js'
export type { UnmodelledPattern } from './unmodelled.js'
// The version reading is neutral; it is re-exported so a consumer of this
// package keeps finding it where it always was.
export { declaredMajor, testedMajors } from '@memolabs-apps/source'
export { buildGraph } from './graph.js'
export { inspect } from './inspect.js'
