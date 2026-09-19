/** Canonical npm name of this package. Kept in code so the import
 *  boundary checks can assert against it without reading package.json. */
export const PACKAGE_NAME = '@memolabs-apps/runtime'

/** One line describing this package's role in the Navirox stack. */
export const PACKAGE_ROLE =
  'The runtime seam: the single interface every public Navirox package depends on.'

export type {
  HostComponent,
  MountOptions,
  NativeComponentSpec,
  NativeModuleRegistry,
  NativeRuntime,
  NaviroxComponent,
  NavigationBackend,
  NavigationCapabilities,
  Platform,
  RuntimeCapabilities,
  RuntimeFactory,
  RuntimeFactoryOptions,
  RuntimeHandle,
} from './types.js'

export { assertNativeRuntime, createRuntime } from './create-runtime.js'

/**
 * The module contracts a provider implements and a façade consumes. Exported as
 * values as well as types, because the ids are what an app's provider registers
 * under and what a façade looks one up by.
 */
export { HAPTICS_MODULE_ID, SECURE_STORE_MODULE_ID } from './native-modules.js'
export type {
  HapticImpactStyle,
  HapticNotificationType,
  HapticsModule,
  SecureStoreModule,
} from './native-modules.js'

/**
 * The key a runtime hands itself to the Vue tree under.
 *
 * A façade above the seam reaches a component the runtime supplies, a list for
 * instance, by injecting the runtime rather than importing the renderer. The key
 * is a plain symbol, so the seam declares it without a Vue value import, and it
 * is registered rather than fresh so two copies of this package still agree on
 * one key.
 */
export const RUNTIME_INJECTION_KEY: symbol = Symbol.for('navirox:runtime')
