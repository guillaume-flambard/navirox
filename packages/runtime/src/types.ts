import type { Component } from 'vue'

/**
 * A platform a runtime can target.
 *
 * Deliberately narrow. Navirox ships mobile first, and listing platforms we
 * have not tested would turn a capability report into a claim.
 */
export type Platform = 'ios' | 'android'

/**
 * A component the runtime can mount or register as a screen.
 *
 * Aliased rather than re-exported from `vue` at every use site, so consumers
 * import their types from one place and the seam stays readable.
 */
export type NaviroxComponent = Component

/** Options passed to {@link NativeRuntime.mount}. */
export interface MountOptions {
  /** Label for the mounted surface, used by dev tooling and error messages. */
  readonly name?: string
  /** Replace an already-mounted surface instead of failing. Defaults to false. */
  readonly replace?: boolean
}

/** Handle returned by {@link NativeRuntime.mount}. */
export interface RuntimeHandle {
  /** Tear the surface down and release its native resources. Idempotent. */
  unmount(): void
  /** Whether the surface is still mounted. */
  readonly mounted: boolean
}

/** A host primitive an app may render, for example `view`, `text`, `pressable`. */
export interface HostComponent {
  /** The tag an app renders in a template. */
  readonly tag: string
  /** Platforms this primitive is implemented on. */
  readonly platforms: readonly Platform[]
}

/** A custom native view registered with the runtime (native-view wrappers). */
export interface NativeComponentSpec {
  /** The tag an app will render. */
  readonly tag: string
  /** The view manager name the native host knows this component by. */
  readonly nativeName: string
  /** Component prop name to native prop name. */
  readonly props?: Readonly<Record<string, string>>
  /** Event names this component can emit. */
  readonly events?: readonly string[]
  /** Platforms this component supports. Defaults to every runtime platform. */
  readonly platforms?: readonly Platform[]
}

/** Access to native modules, with the Expo-module bridge living behind it. */
export interface NativeModuleRegistry {
  /** Ids of every module this runtime exposes. */
  readonly ids: readonly string[]
  /** Whether a module is available on this platform. */
  has(moduleId: string): boolean
  /** The module's exports, or `undefined` when it is not available. */
  get<T = unknown>(moduleId: string): T | undefined
}

/** What a navigation backend can do. Navirox builds routing on top of this. */
export interface NavigationCapabilities {
  readonly stack: boolean
  readonly tabs: boolean
  readonly drawer: boolean
  readonly modal: boolean
  readonly deepLinks: boolean
}

/** The navigation primitive the runtime exposes. */
export interface NavigationBackend {
  readonly id: string
  /** Features this backend implements. */
  readonly supports: NavigationCapabilities
  /** Register a screen component under a route name. */
  registerScreen(name: string, component: NaviroxComponent): void
}

/** Runtime-level facts, so `navirox doctor` can diff reality against the registry. */
export interface RuntimeCapabilities {
  readonly newArch: boolean
  readonly fabric: boolean
  readonly legacyFallback: boolean
  readonly platforms: readonly Platform[]
  readonly modules: readonly string[]
}

/**
 * The only contract `@navirox/runtime-symbiote` has to satisfy.
 *
 * Deliberately small. Every member is something a *different* renderer could
 * plausibly supply. If this interface ever grows toward Symbiote's full API it
 * has failed, because it becomes Symbiote with extra steps.
 */
export interface NativeRuntime {
  readonly id: string
  readonly version: string

  /** Register and mount the root component; returns an unmount handle. */
  mount(root: NaviroxComponent, options?: MountOptions): RuntimeHandle

  /** Host primitives the app may render. */
  readonly hostComponents: Readonly<Record<string, HostComponent>>
  /** Register a custom native view. */
  registerNativeComponent(spec: NativeComponentSpec): void

  /** Native module access; the Expo-module bridge lives behind this. */
  readonly nativeModules: NativeModuleRegistry

  /** Navigation backend handle; Navirox supplies routing on top. */
  readonly navigation: NavigationBackend

  /** Runtime-level capabilities, so `doctor` can diff them. */
  readonly capabilities: RuntimeCapabilities
}

/** Options handed to a runtime factory. */
export interface RuntimeFactoryOptions {
  /** Resolved `navirox.config.ts` values. */
  readonly config?: Readonly<Record<string, unknown>>
  /** Restrict the runtime to these platforms. Defaults to all it supports. */
  readonly platforms?: readonly Platform[]
}

/** Builds a runtime. Callers receive the seam, never the factory. */
export type RuntimeFactory = (options: RuntimeFactoryOptions) => NativeRuntime
