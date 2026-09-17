import type { NativeRuntime } from '@navirox/runtime'
import { bootstrapHost } from '@symbiote-native/components/bootstrap'
import { HOST_PRIMITIVES } from '@symbiote-native/components/host-primitives'
import { AppRegistry, setAppConfigurator, setHostRegistrar } from '@symbiote-native/vue'
import { AppRegistry as RNAppRegistry } from 'react-native'
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
      // `bootstrapHost` wires four React Native backed seams into the engine: the
      // colour processor, the asset resolver, the device event emitter, and the
      // native view config source. That last one is what lets a third-party Fabric
      // view derive its events and prop processors from React Native's own registry
      // instead of a hand-maintained table.
      //
      // `setHostRegistrar` then hands React Native's own registry to the renderer, so
      // the native host can find a runnable by app key. Upstream does both in this
      // order in `@symbiote-native/vue/bootstrap`; Navirox has to do it itself
      // because the app is not allowed to import that entry.
      prepare: () => {
        bootstrapHost()
        // React Native's own registry is the registrar the renderer has to delegate
        // to, so the value is right by construction. The two declarations cannot
        // unify: React Native types its root tag opaquely, and it widened that type
        // between 0.86 and 0.87, while the engine declares its own `IRootTag`. This
        // is the one place the two vocabularies meet, so the cast stays here rather
        // than spreading through call sites.
        setHostRegistrar(RNAppRegistry as unknown as Parameters<typeof setHostRegistrar>[0])
      },
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
