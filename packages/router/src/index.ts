import { PACKAGE_NAME as SEAM_PACKAGE_NAME } from '@navirox/runtime'
import type { NativeRuntime, NaviroxComponent, NavigationCapabilities } from '@navirox/runtime'

/** Canonical npm name of this package. Kept in code so the import
 *  boundary checks can assert against it without reading package.json. */
export const PACKAGE_NAME = '@navirox/router'

/** One line describing this package's role in the Navirox stack. */
export const PACKAGE_ROLE = 'File-based routing plus a generated, fully typed route manifest.'

/** The package this one is built on. Every public Navirox package sits on the
 *  runtime seam rather than on a concrete runtime. */
export const BUILT_ON: string = SEAM_PACKAGE_NAME

/** A backend feature routing can require. */
export type NavigationFeature = keyof NavigationCapabilities

/** A route as registered with the navigation backend. */
export interface RouteDefinition {
  /** Route name, matching the file-based route once the generator exists. */
  readonly name: string
  /** The screen component to render for this route. */
  readonly component: NaviroxComponent
}

/** Options for {@link createRouter}. */
export interface RouterOptions {
  /** Backend features routing requires. Defaults to `['stack']`. */
  readonly require?: readonly NavigationFeature[]
}

/**
 * The routing surface.
 *
 * Navirox owns this API; the navigation backend underneath is swappable, which
 * is why nothing here is named after a navigation library.
 */
export interface NaviroxRouter {
  /** The backend this router is bound to. */
  readonly backendId: string
  /** What that backend can do. */
  readonly supports: NavigationCapabilities
  /** Route names registered so far, in registration order. */
  readonly routes: readonly string[]
  /** Register a route with the navigation backend. */
  register(definition: RouteDefinition): void
}

const DEFAULT_REQUIRED: readonly NavigationFeature[] = ['stack']

/**
 * Bind routing to a runtime's navigation backend.
 *
 * Checks the backend actually supports what routing needs before registering
 * anything, so an incapable backend fails at setup with a readable message.
 */
export function createRouter(runtime: NativeRuntime, options: RouterOptions = {}): NaviroxRouter {
  const required = options.require ?? DEFAULT_REQUIRED
  const unsupported = required.filter((feature) => runtime.navigation.supports[feature] !== true)

  if (unsupported.length > 0) {
    throw new Error(
      `The "${runtime.navigation.id}" navigation backend does not support ` +
        `${unsupported.join(', ')}. Navirox routing requires ${required.join(', ')}.`,
    )
  }

  const routes: string[] = []

  return {
    backendId: runtime.navigation.id,
    supports: runtime.navigation.supports,
    routes,

    register(definition: RouteDefinition): void {
      runtime.navigation.registerScreen(definition.name, definition.component)
      routes.push(definition.name)
    },
  }
}
