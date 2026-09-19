import {
  HAPTICS_MODULE_ID,
  PACKAGE_NAME as SEAM_PACKAGE_NAME,
  RUNTIME_INJECTION_KEY,
  SECURE_STORE_MODULE_ID,
} from '@memolabs-apps/runtime'
import type {
  HapticsModule,
  NativeModuleRegistry,
  NativeRuntime,
  SecureStoreModule,
} from '@memolabs-apps/runtime'
import { inject, type InjectionKey } from 'vue'

/** Canonical npm name of this package. Kept in code so the import
 *  boundary checks can assert against it without reading package.json. */
export const PACKAGE_NAME = '@memolabs-apps/native'

/** One line describing this package's role in the Navirox stack. */
export const PACKAGE_ROLE =
  'Vue-first native API surface (haptics, storage, camera, location) over a pluggable provider.'

/** The package this one is built on. Every public Navirox package sits on the
 *  runtime seam rather than on a concrete runtime. */
export const BUILT_ON: string = SEAM_PACKAGE_NAME

/** Module ids Navirox 0.1 expects the provider layer to supply.
 *
 *  The first two are the ids the seam itself names, because this package and
 *  the adapter that answers them have to agree on the spelling. The rest are
 *  what 0.2 adds, and they are only expectations: `missing()` reports them and
 *  nothing else depends on them being there yet. */
export const KNOWN_MODULES: readonly string[] = [
  HAPTICS_MODULE_ID,
  SECURE_STORE_MODULE_ID,
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
  /** Haptics, typed, or a throw naming the runtime when no provider answered. */
  haptics(): HapticsModule
  /** Secure storage, typed, or a throw naming the runtime when no provider answered. */
  secureStore(): SecureStoreModule
  /** Which of the expected modules this runtime does not expose. */
  missing(): readonly string[]
}

/**
 * Bind the native API surface to a runtime.
 *
 * The provider bridge lives behind `runtime.nativeModules`, so nothing in this
 * package knows which provider is in play. The two 0.1 modules get a typed
 * accessor each because that is the point of the facade: an app asks for
 * haptics or secure storage by intent, and the type it gets back is the seam's
 * contract rather than one provider's signature.
 */
export function createNativeApi(runtime: NativeRuntime, options: NativeApiOptions = {}): NativeApi {
  const expected = options.expect ?? KNOWN_MODULES
  const registry = runtime.nativeModules

  const resolve = <T>(moduleId: string): T => {
    const nativeModule = registry.get<T>(moduleId)
    if (nativeModule === undefined) {
      const available = registry.ids.length > 0 ? registry.ids.join(', ') : 'none'
      throw new Error(
        `The "${runtime.id}" runtime does not expose a native module named "${moduleId}". ` +
          `Available modules: ${available}.`,
      )
    }
    return nativeModule
  }

  return {
    runtimeId: runtime.id,
    modules: registry,

    available: () => registry.ids,

    has: (moduleId) => registry.has(moduleId),

    require: <T = unknown>(moduleId: string): T => resolve<T>(moduleId),

    haptics: () => resolve<HapticsModule>(HAPTICS_MODULE_ID),

    secureStore: () => resolve<SecureStoreModule>(SECURE_STORE_MODULE_ID),

    missing: () => expected.filter((moduleId) => !registry.has(moduleId)),
  }
}

/**
 * The key the adapter provides the runtime under, typed for `inject`.
 *
 * The seam exports a plain symbol, because no Vue value may appear in a seam
 * signature. The cast happens here, in the one package of the pair that has to
 * hand it to Vue.
 */
const RUNTIME_KEY = RUNTIME_INJECTION_KEY as InjectionKey<NativeRuntime>

/**
 * The runtime the current component tree was mounted under.
 *
 * It throws rather than returning undefined: a component that reaches for a
 * native API outside a Navirox runtime has no fallback worth having, and the
 * call it was about to make would fail later with a message naming nothing.
 */
export function useRuntime(): NativeRuntime {
  const runtime = inject(RUNTIME_KEY, undefined)

  if (runtime === undefined) {
    throw new Error(
      'This component needs a Navirox runtime, and none was provided above it. Mount the app through `createSymbioteRuntime` so the runtime is in scope.',
    )
  }

  return runtime
}

/** The facade for the runtime in scope. */
export function useNativeApi(options: NativeApiOptions = {}): NativeApi {
  return createNativeApi(useRuntime(), options)
}

/** Haptics from the runtime in scope. */
export function useHaptics(): HapticsModule {
  return useNativeApi().haptics()
}

/** Secure storage from the runtime in scope. */
export function useSecureStore(): SecureStoreModule {
  return useNativeApi().secureStore()
}
