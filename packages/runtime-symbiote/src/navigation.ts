import type { NaviroxComponent, NavigationBackend, NavigationCapabilities } from '@navirox/runtime'

export const SYMBIOTE_NAVIGATION_ID = 'symbiote-navigation'

/**
 * What the Symbiote navigation backend actually provides. All four navigators
 * and the linking integration are live upstream; `deepLinks` is backed by
 * `useLinkingIntegration` in `@symbiote-native/navigation/vue`.
 */
export const SYMBIOTE_NAVIGATION_SUPPORTS: NavigationCapabilities = {
  stack: true,
  tabs: true,
  drawer: true,
  modal: true,
  deepLinks: true,
}

export interface SymbioteNavigation extends NavigationBackend {
  /** The component registered under a screen name, if any. */
  screen(name: string): NaviroxComponent | undefined
  /** The registered screen names, in registration order. */
  readonly screens: readonly string[]
}

/**
 * The Navirox-side screen registry.
 *
 * This is deliberately ours and not a wrapper over upstream, because upstream
 * has no imperative registration to wrap: `Screen` from
 * `@symbiote-native/navigation/vue` is a declarative marker that is never
 * mounted on its own. `Stack` scans its default slot, matches
 * `vnode.type === Screen`, and reads `vnode.props` directly to build its static
 * name -> { component, options } table. `Screen`'s own `setup()` never runs.
 *
 * So pretending to register a screen with upstream would be a lie. What we can
 * honestly do is hold the name -> component map that our own routing layer
 * populates and our own `<Stack>` render layer later reads, and report the
 * capability truthfully so `navirox doctor` can diff it.
 */
export function createSymbioteNavigation(): SymbioteNavigation {
  const components = new Map<string, NaviroxComponent>()

  return {
    id: SYMBIOTE_NAVIGATION_ID,
    supports: SYMBIOTE_NAVIGATION_SUPPORTS,
    registerScreen(name: string, component: NaviroxComponent): void {
      if (name.trim() === '') {
        throw new TypeError('A screen name cannot be empty.')
      }
      components.set(name, component)
    },
    screen(name: string): NaviroxComponent | undefined {
      return components.get(name)
    },
    get screens(): readonly string[] {
      return [...components.keys()]
    },
  }
}
