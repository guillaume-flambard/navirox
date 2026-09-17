/** Canonical npm name of this package. Kept in code so the import
 *  boundary checks can assert against it without reading package.json. */
export const PACKAGE_NAME = '@navirox/runtime'

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
