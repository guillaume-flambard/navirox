import { PACKAGE_NAME as SEAM_PACKAGE_NAME } from '@memolabs-apps/runtime'

export const PACKAGE_NAME = '@memolabs-apps/runtime-symbiote'
export const PACKAGE_ROLE =
  'The Symbiote-backed implementation of the runtime seam. The only package allowed to import @symbiote-native/*.'
export const BUILT_ON: string = SEAM_PACKAGE_NAME

/**
 * This barrel is deliberately host-free: it imports no `@symbiote-native/*`
 * package, so `@memolabs-apps/compat` and `navirox doctor` can read the manifest from
 * plain Node.
 *
 * The renderer edge lives in `@memolabs-apps/runtime-symbiote/bootstrap`, which is the
 * only file allowed to import the renderer, and the renderer itself is injected
 * into `createRuntimeFromHost` here so every decision stays testable without it.
 */
export {
  diffManifestPins,
  manifestPins,
  RUNTIME_MANIFEST,
  satisfiesRange,
  type RuntimeManifest,
} from './manifest.js'
export {
  DEFAULT_PLATFORMS,
  hostComponentsFrom,
  intrinsicTagsOf,
  type HostPrimitiveEntry,
  type HostPrimitiveTable,
} from './host-components.js'
export {
  createSymbioteNavigation,
  SYMBIOTE_NAVIGATION_ID,
  SYMBIOTE_NAVIGATION_SUPPORTS,
  type SymbioteNavigation,
} from './navigation.js'
export { createNativeModuleRegistry } from './native-modules.js'
export {
  createRuntimeFromHost,
  DEFAULT_APP_KEY,
  RUNTIME_ID,
  type ConfigureApp,
  type SymbioteHost,
  type SymbioteRuntimeOptions,
} from './symbiote-runtime.js'
export {
  SYMBIOTE_SOURCE_EXTENSIONS,
  SYMBIOTE_VUE_TRANSFORMER,
  symbioteVueTransformerPath,
} from './build-integration.js'
