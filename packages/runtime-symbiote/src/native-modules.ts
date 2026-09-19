import type { NativeModuleRegistry } from '@memolabs-apps/runtime'

/**
 * The native module registry, supplied by the app.
 *
 * Symbiote ships roughly thirty `expo-modules-core`-based wrapper packages, but
 * there is no central registry to ask "which modules are installed" — upstream's
 * engine reads a native view's ViewConfig lazily on first use, and modules are
 * plain imports. So the only honest source for this list is the application,
 * which knows what it installed.
 *
 * The value is that the seam gets a single, queryable answer: `@memolabs-apps/native`
 * can report exactly which of the modules an app expects are actually present,
 * instead of failing deep inside a render.
 */
export function createNativeModuleRegistry(
  values: Readonly<Record<string, unknown>> = {},
): NativeModuleRegistry {
  const ids = Object.keys(values).sort()
  return {
    ids,
    has(moduleId: string): boolean {
      return Object.prototype.hasOwnProperty.call(values, moduleId)
    },
    get<T = unknown>(moduleId: string): T | undefined {
      return values[moduleId] as T | undefined
    },
  }
}
