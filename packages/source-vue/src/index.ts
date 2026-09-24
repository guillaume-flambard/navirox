import type { SourceAdapter } from '@memolabs-apps/source'
import { ADAPTER_ID, DISPLAY_NAME, FRAMEWORK, TESTED_VERSIONS, detect } from './detect.js'
import { buildGraph } from './graph.js'
import { inspect } from './inspect.js'

export const PACKAGE_NAME = '@memolabs-apps/source-vue'

export const PACKAGE_ROLE =
  'The Vue source adapter: detection, single file component inspection, and App Graph construction for an existing Vue application.'

/**
 * The Vue adapter.
 *
 * The support level is `experimental` and that is the honest label: literal Vue
 * Router routes, including literal nested routes, are extracted; plugins are
 * not resolved, no migration transform exists, and capability detection is a
 * declared pattern scan. The four levels exist so that this can be said in one
 * word instead of a paragraph of caveats.
 */
export function createVueAdapter(): SourceAdapter {
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
// The capability scan is neutral and lives in `@memolabs-apps/source`; it is
// re-exported here because this adapter was its first user and a consumer of this
// package should not have to know where it moved.
export {
  CAPABILITY_PATTERNS,
  DECLARED_CAPABILITIES,
  DOM_PATTERNS,
  scanCapabilities,
} from '@memolabs-apps/source'
export type { CapabilityPattern } from '@memolabs-apps/source'
export {
  MANIFEST_FILE,
  declaredRange,
  productionDependencies,
  readManifest,
} from '@memolabs-apps/source'
export type { DeclaredRange, Manifest, TextReader } from '@memolabs-apps/source'
export { UNMODELLED_PATTERNS, scanUnmodelled } from './unmodelled.js'
export type { UnmodelledPattern } from './unmodelled.js'
// The version reading is neutral; it is re-exported so a consumer of this
// package keeps finding it where it always was.
export { declaredMajor, testedMajors } from '@memolabs-apps/source'
export { buildGraph } from './graph.js'
export { inspect } from './inspect.js'
export { createVueLowering } from './lower.js'
export { createVueWorkspaceProvider } from './workspace.js'
