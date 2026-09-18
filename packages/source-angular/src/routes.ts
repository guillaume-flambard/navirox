import type { SourceLocation } from '@navirox/graph'
import type { DiscoveredRoute } from '@navirox/source'

/**
 * Angular's routes, read from the file that states them.
 *
 * A `path` literal is a fact. A `children` array is a nested configuration, and
 * `loadChildren` is a function call rather than data, so neither is resolved into
 * a path: concatenating them would produce patterns that are right until the day a
 * guard or a redirect changes what the application actually does.
 *
 * The top level is therefore taken to be what the file states before its first
 * children block, which is a heuristic and is stated as one.
 */

/** Files this adapter reads routes from. */
export const ROUTES_FILE_PATTERN = /\.routes\.[cm]?ts$/

export function isRoutesFile(file: string): boolean {
  return ROUTES_FILE_PATTERN.test(file)
}

export interface RouteReading {
  readonly routes: readonly DiscoveredRoute[]
  readonly findings: readonly FindingDraft[]
}

export interface FindingDraft {
  readonly code: string
  readonly title: string
  readonly message: string
  readonly file: string
}

/** The URL a stated path serves, and the parameters in it. */
export function routePattern(path: string): {
  readonly pattern: string
  readonly params: readonly string[]
} {
  const params = [...path.matchAll(/:([A-Za-z_][\w]*)/g)].map((match) => match[1] ?? '')

  if (path === '') {
    return { pattern: '/', params: [] }
  }

  return { pattern: path.startsWith('/') ? path : `/${path}`, params }
}

export function readRoutes(file: string, text: string): RouteReading {
  const childrenIndex = text.indexOf('children:')
  const head = childrenIndex === -1 ? text : text.slice(0, childrenIndex)
  const routes: DiscoveredRoute[] = []
  const findings: FindingDraft[] = []

  for (const match of head.matchAll(/path\s*:\s*'([^']*)'/g)) {
    const path = match[1] ?? ''
    const { pattern, params } = routePattern(path)
    const source: SourceLocation = { file, adapterId: 'angular' }

    routes.push({
      key: pattern,
      pathPattern: pattern,
      ...(params.length === 0 ? {} : { params }),
      source,
    })
  }

  if (childrenIndex !== -1) {
    findings.push({
      code: 'angular-route-children',
      title: 'Nested routes were not resolved',
      message: `${file} declares children under a path. This adapter reads top level paths only, so the children produced no route.`,
      file,
    })
  }

  if (/loadChildren\s*:/.test(text)) {
    findings.push({
      code: 'angular-lazy-route',
      title: 'A lazy loaded route was not resolved',
      message: `${file} loads a route lazily, which is a call rather than a path. It produced no route.`,
      file,
    })
  }

  return { routes: routes.sort((left, right) => left.key.localeCompare(right.key)), findings }
}
