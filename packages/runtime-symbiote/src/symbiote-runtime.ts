import { RUNTIME_INJECTION_KEY } from '@navirox/runtime'
import type {
  MountOptions,
  NativeRuntime,
  NaviroxComponent,
  Platform,
  RuntimeHandle,
} from '@navirox/runtime'
import {
  DEFAULT_PLATFORMS,
  hostComponentsFrom,
  type HostPrimitiveTable,
} from './host-components.js'
import { createNativeModuleRegistry } from './native-modules.js'
import { createSymbioteNavigation } from './navigation.js'

export const RUNTIME_ID = 'symbiote'

/** The AppRegistry key used when the caller does not name one. */
export const DEFAULT_APP_KEY = 'NaviroxRoot'

/**
 * Handed the live Vue app after the default error handler is installed and before
 * it mounts, so an app can `use()` a plugin (Pinia), `provide()` a value, or swap
 * `config.errorHandler` and still catch its own first render.
 *
 * Deliberately typed `unknown`: the seam must not put a renderer's app type into a
 * `@navirox/*` signature, or the engine stops being swappable.
 */
export type ConfigureApp = (app: unknown) => void

/**
 * Everything this runtime needs from the renderer, as data and functions.
 *
 * It is an interface rather than a direct import because the published
 * `@symbiote-native/*` builds cannot be loaded by plain Node. Their compiled ESM
 * uses extensionless relative directory imports, which Metro and Vite resolve and
 * Node's ESM resolver rejects outright, so importing the renderer here would make
 * this module untestable everywhere except inside a bundler.
 *
 * Injecting it puts the untestable part in one short shell (`./bootstrap.ts`, the
 * only file in Navirox that imports the renderer) and keeps every decision in this
 * file — mounting, capability reporting, screen registration, module reporting —
 * under an ordinary Node test.
 */
export interface SymbioteHost {
  /**
   * Wires the host seams the renderer needs before anything can mount: the colour
   * processor, the asset resolver, the device event source, and the native view
   * config source. Called once, before any registration.
   *
   * Required rather than optional on purpose. A host that forgot it would fail at
   * the first commit with no useful error, and the failure would look like a
   * renderer bug rather than a missing step.
   */
  prepare(): void
  /** Upstream's authoritative tag table, `HOST_PRIMITIVES` from the components package. */
  readonly primitives: HostPrimitiveTable
  /**
   * Components the renderer supplies that an app imports instead of rendering as
   * a tag, keyed by the tag spelling the seam uses.
   *
   * The host is where these are named because naming one means importing the
   * renderer, and this file must stay loadable by plain Node. A list virtualizes,
   * so it owns state and cannot be a tag; that is the whole membership rule.
   */
  readonly components: Readonly<Record<string, NaviroxComponent>>
  /** Registers an app key with the renderer's registry. Returns the app key. */
  registerComponent(appKey: string, componentProvider: () => NaviroxComponent): unknown
  /** Installs the configurator the renderer applies to the next mount. */
  setAppConfigurator(configure: ConfigureApp): void
  /** The renderer core version, reported as this runtime's `version`. */
  readonly engineVersion: string
}

export interface SymbioteRuntimeOptions {
  /** Override the runtime id. Useful only in tests that simulate another engine. */
  readonly id?: string
  /** Platforms this runtime claims. Defaults to iOS and Android. */
  readonly platforms?: readonly Platform[]
  /** AppRegistry key. Defaults to `NaviroxRoot`. */
  readonly appKey?: string
  /** The native modules the application installed. */
  readonly modules?: Readonly<Record<string, unknown>>
  /** Sets the app configurator for the next mount. This is the Pinia seam. */
  readonly configure?: ConfigureApp
  /**
   * Present so this factory satisfies `RuntimeFactory` from `@navirox/runtime`.
   * `appKey` and `modules` are read from here when the named options are absent.
   */
  readonly config?: Readonly<Record<string, unknown>>
}

/**
 * The Symbiote-backed runtime, built from an injected renderer host.
 *
 * Every other Navirox package talks to the seam in `@navirox/runtime`, so a
 * Symbiote major bump (there were two in three months) cannot break the toolchain,
 * the router or the component surface.
 */
export function createRuntimeFromHost(
  host: SymbioteHost,
  options: SymbioteRuntimeOptions = {},
): NativeRuntime {
  const platforms = options.platforms ?? DEFAULT_PLATFORMS
  const appKey = options.appKey ?? readString(options.config, 'appKey') ?? DEFAULT_APP_KEY
  const configure = options.configure
  const nativeModules = createNativeModuleRegistry(
    options.modules ?? readRecord(options.config, 'modules'),
  )

  // Before anything else: the host seams (colour processor, asset resolver, device
  // events, native view configs) must be wired before the first component commits,
  // and `setAppConfigurator` below is only meaningful once the host is prepared.
  host.prepare()

  const hostComponents = hostComponentsFrom(host.primitives, platforms)
  const navigation = createSymbioteNavigation()

  const runtime: NativeRuntime = {
    id: options.id ?? RUNTIME_ID,
    // A single string cannot express four independently moving version lines, so
    // this reports the renderer core and the full matrix lives in `runtime.json`.
    version: host.engineVersion,

    mount(root: NaviroxComponent, mountOptions: MountOptions = {}): RuntimeHandle {
      // Mount is REGISTRATION, not rendering. The registry stores a component
      // provider; the native host later calls it with `{ rootTag, initialProps }`
      // and the real imperative mount happens then.
      host.registerComponent(mountOptions.name ?? appKey, () => root)

      let mounted = true
      return {
        unmount(): void {
          // Honest limitation: upstream's registry has no `unregisterComponent`.
          // A surface is torn down by the native host through `RN$stopSurface`,
          // which the renderer installs as a global. All Navirox can do here is stop
          // claiming the handle is live. Reported rather than papered over.
          mounted = false
        },
        get mounted(): boolean {
          return mounted
        },
      }
    },

    hostComponents,

    components: host.components,

    registerNativeComponent(spec): void {
      hostComponents[spec.tag] = {
        tag: spec.tag,
        platforms: spec.platforms ?? platforms,
        ...(spec.props === undefined ? {} : { props: spec.props }),
        ...(spec.events === undefined ? {} : { events: spec.events }),
      }
      // No call into the engine's `registerComponent` here, deliberately. That
      // function is an escape hatch for views with no codegen ViewConfig, and the
      // engine derives a codegen'd Fabric view's events and prop processors from
      // React Native's own registry on first commit. A second, hand-written copy
      // would duplicate that metadata and could contradict it. Registering the tag
      // on our side is what makes it visible to Navirox tooling.
    },

    nativeModules,

    navigation,

    capabilities: {
      newArch: true,
      fabric: true,
      legacyFallback: false,
      platforms,
      modules: nativeModules.ids,
    },
  }

  // `setAppConfigurator` is process-global state that applies to the next surface
  // mount, and an app builds the runtime before it mounts, so it is installed here
  // rather than inside `mount`, where a second surface would silently replace it.
  // Two configurators are composed: the seam's own, which hands the runtime to the
  // tree, then the app's, which may want to use the runtime it is running on.
  host.setAppConfigurator((app) => {
    provideRuntime(app, runtime)
    configure?.(app)
  })

  return runtime
}

/**
 * Hands the runtime to the app it mounts, under the seam's injection key.
 *
 * A façade above the seam reaches a component the runtime supplies by injecting
 * the runtime, which is what keeps the façade from importing the renderer to get
 * one. Typed structurally and called optionally: the seam must not name the
 * renderer's app type, and a host whose app cannot provide should still mount.
 */
function provideRuntime(app: unknown, runtime: NativeRuntime): void {
  const target = app as { provide?: (key: unknown, value: unknown) => void }
  target.provide?.(RUNTIME_INJECTION_KEY, runtime)
}

function readString(
  config: Readonly<Record<string, unknown>> | undefined,
  key: string,
): string | undefined {
  const value = config?.[key]
  return typeof value === 'string' ? value : undefined
}

function readRecord(
  config: Readonly<Record<string, unknown>> | undefined,
  key: string,
): Readonly<Record<string, unknown>> | undefined {
  const value = config?.[key]
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined
  return value as Readonly<Record<string, unknown>>
}
