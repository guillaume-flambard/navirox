import type {
  HostComponent,
  MountOptions,
  NativeComponentSpec,
  NativeRuntime,
  NaviroxComponent,
  NavigationCapabilities,
  Platform,
  RuntimeHandle,
} from './types.js'

/** A call the stub recorded, so a contract test can assert what happened. */
export type StubCall =
  | { readonly type: 'mount'; readonly name: string | undefined }
  | { readonly type: 'unmount' }
  | { readonly type: 'registerNativeComponent'; readonly tag: string }
  | { readonly type: 'registerScreen'; readonly name: string }

/** The stub runtime, plus the observation points tests assert against. */
export interface StubRuntime extends NativeRuntime {
  /** Every call the runtime received, in order. */
  readonly log: readonly StubCall[]
  /** Route names registered through `navigation.registerScreen`. */
  readonly screens: readonly string[]
}

/** Knobs for the stub. Every one of them exists so a failure path is testable. */
export interface StubRuntimeOptions {
  readonly id?: string
  readonly version?: string
  readonly platforms?: readonly Platform[]
  /** Host primitive tags the stub claims to support. */
  readonly hostComponents?: readonly string[]
  /** Components the stub claims to supply by import, keyed by tag. */
  readonly components?: readonly string[]
  /** Modules the stub exposes, keyed by module id. */
  readonly modules?: Readonly<Record<string, unknown>>
  /** Overrides merged over the stub's default navigation capabilities. */
  readonly navigation?: Partial<NavigationCapabilities>
}

/** The primitives shipped upstream and required by Navirox 0.1. */
const DEFAULT_HOST_COMPONENTS = [
  'view',
  'text',
  'pressable',
  'text-input',
  'scroll-view',
  'image',
] as const

/** The imported components required by Navirox 0.1. A list virtualizes, so it is one. */
const DEFAULT_COMPONENTS = ['flat-list'] as const

/**
 * Stands in for a component a runtime supplies by import.
 *
 * A function component rather than a `vue` value, because this file is importable
 * by plain Node and the stub renders nothing anyway.
 */
const stubComponent: NaviroxComponent = () => null

/**
 * A runtime that renders nothing.
 *
 * It exists so `@navirox/ui`, `@navirox/native` and `@navirox/router` can be
 * exercised against the seam with no Symbiote, no React Native and no simulator
 * present. It is a test double, not a product runtime.
 */
export function createStubRuntime(options: StubRuntimeOptions = {}): StubRuntime {
  const id = options.id ?? 'stub'
  const version = options.version ?? '0.0.0'
  const platforms: readonly Platform[] = options.platforms ?? ['ios', 'android']
  const tags = options.hostComponents ?? DEFAULT_HOST_COMPONENTS
  const componentTags = options.components ?? DEFAULT_COMPONENTS
  const modules = options.modules ?? {}

  const log: StubCall[] = []
  const screenNames: string[] = []
  let mounted = false

  const hostComponents: Record<string, HostComponent> = {}
  for (const tag of tags) hostComponents[tag] = { tag, platforms }

  const components: Record<string, NaviroxComponent> = {}
  for (const tag of componentTags) components[tag] = stubComponent

  return {
    id,
    version,

    mount(_root: NaviroxComponent, mountOptions: MountOptions = {}): RuntimeHandle {
      mounted = true
      log.push({ type: 'mount', name: mountOptions.name })
      return {
        get mounted() {
          return mounted
        },
        unmount() {
          mounted = false
          log.push({ type: 'unmount' })
        },
      }
    },

    hostComponents,

    components,

    registerNativeComponent(spec: NativeComponentSpec): void {
      hostComponents[spec.tag] = { tag: spec.tag, platforms: spec.platforms ?? platforms }
      log.push({ type: 'registerNativeComponent', tag: spec.tag })
    },

    nativeModules: {
      ids: Object.keys(modules).sort(),
      has: (moduleId) => Object.prototype.hasOwnProperty.call(modules, moduleId),
      get: <T = unknown>(moduleId: string) => modules[moduleId] as T | undefined,
    },

    navigation: {
      id: `${id}-navigation`,
      supports: {
        stack: true,
        tabs: true,
        drawer: true,
        modal: true,
        deepLinks: false,
        ...options.navigation,
      },
      registerScreen(name: string): void {
        screenNames.push(name)
        log.push({ type: 'registerScreen', name })
      },
    },

    capabilities: {
      newArch: true,
      fabric: true,
      legacyFallback: false,
      platforms,
      modules: Object.keys(modules).sort(),
    },

    log,
    get screens() {
      return screenNames
    },
  }
}
