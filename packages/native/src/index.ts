import { PACKAGE_NAME as SEAM_PACKAGE_NAME } from '@navirox/runtime'
import type { NativeModuleRegistry, NativeRuntime } from '@navirox/runtime'

/** Canonical npm name of this package. Kept in code so the import
 *  boundary checks can assert against it without reading package.json. */
export const PACKAGE_NAME = '@navirox/native'

/** One line describing this package's role in the Navirox stack. */
export const PACKAGE_ROLE =
  'Vue-first native API surface (haptics, storage, camera, location) over a pluggable provider.'

/** The package this one is built on. Every public Navirox package sits on the
 *  runtime seam rather than on a concrete runtime. */
export const BUILT_ON: string = SEAM_PACKAGE_NAME

/** Module ids Navirox 0.1 expects the provider layer to supply. */
export const KNOWN_MODULES: readonly string[] = [
  'haptics',
  'secure-store',
  'clipboard',
  'device',
  'application',
]

/** Options for {@link createNativeApi}. */
export interface NativeApiOptions {
  /** Module ids to report as missing via `missing()`. Defaults to KNOWN_MODULES. */
  readonly expect?: readonly string[]
}

/**
 * The provider facade.
 *
 * User code asks this for a module by intent, never for a concrete library, so
 * the provider underneath (today Expo module wrappers, later a bare adapter)
 * can change without touching an app.
 */
export interface NativeApi {
  /** The runtime this API is bound to. */
  readonly runtimeId: string
  /** Raw access, for advanced callers and tests. */
  readonly modules: NativeModuleRegistry
  /** Every module id this runtime exposes. */
  available(): readonly string[]
  /** Whether a module is present, without throwing. */
  has(moduleId: string): boolean
  /** Resolve a module, or throw with an actionable message when it is absent. */
  require<T = unknown>(moduleId: string): T
  /** Which of the expected modules this runtime does not expose. */
  missing(): readonly string[]
}

/**
 * Bind the native API surface to a runtime.
 *
 * The Expo-module bridge lives behind `runtime.nativeModules`, so nothing in
 * this package knows which provider is in play.
 */
export function createNativeApi(runtime: NativeRuntime, options: NativeApiOptions = {}): NativeApi {
  const expected = options.expect ?? KNOWN_MODULES
  const registry = runtime.nativeModules

  return {
    runtimeId: runtime.id,
    modules: registry,

    available: () => registry.ids,

    has: (moduleId) => registry.has(moduleId),

    require: <T = unknown>(moduleId: string): T => {
      const nativeModule = registry.get<T>(moduleId)
      if (nativeModule === undefined) {
        const available = registry.ids.length > 0 ? registry.ids.join(', ') : 'none'
        throw new Error(
          `The "${runtime.id}" runtime does not expose a native module named "${moduleId}". ` +
            `Available modules: ${available}.`,
        )
      }
      return nativeModule
    },

    missing: () => expected.filter((moduleId) => !registry.has(moduleId)),
  }
}
