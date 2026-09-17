import type { NativeRuntime } from '@navirox/runtime'
import { HOST_PRIMITIVES } from '@symbiote-native/components/host-primitives'
import { AppRegistry, setAppConfigurator } from '@symbiote-native/vue'
import type { HostPrimitiveTable } from './host-components.js'
import { RUNTIME_MANIFEST } from './manifest.js'
import { createRuntimeFromHost, type SymbioteRuntimeOptions } from './symbiote-runtime.js'

/**
 * The renderer edge: the only file in Navirox that imports `@symbiote-native/*`.
 *
 * It is deliberately kept out of the package's main barrel. Two reasons, one of
 * them measured:
 *
 * 1. The published `@symbiote-native/*` builds cannot be loaded by plain Node.
 *    Their compiled ESM uses extensionless relative directory imports, which Metro
 *    and Vite resolve and Node's ESM resolver rejects with
 *    `ERR_UNSUPPORTED_DIR_IMPORT`. A barrel that imported this file could not be
 *    imported by `@navirox/compat` or `navirox doctor` to read `runtime.json`,
 *    which is exactly what those toolchain packages need from the adapter.
 *
 * 2. It is the same split upstream uses for its own `./bootstrap` entry: anything
 *    that touches the host lives behind its own subpath, so the surface that tooling
 *    reads stays host-free.
 *
 * Import it as `@navirox/runtime-symbiote/bootstrap` from an app, where Metro is the
 * resolver and directory imports are fine.
 */
export function createSymbioteRuntime(options: SymbioteRuntimeOptions = {}): NativeRuntime {
  return createRuntimeFromHost(
    {
      primitives: HOST_PRIMITIVES as HostPrimitiveTable,
      registerComponent: (appKey, componentProvider) =>
        AppRegistry.registerComponent(appKey, componentProvider),
      setAppConfigurator: (configure) => {
        setAppConfigurator(configure)
      },
      engineVersion: RUNTIME_MANIFEST.packages['@symbiote-native/engine'] ?? '0.0.0',
    },
    options,
  )
}

export { createRuntimeFromHost }
export type { SymbioteHost, SymbioteRuntimeOptions, ConfigureApp } from './symbiote-runtime.js'
