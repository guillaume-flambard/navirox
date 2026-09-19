import type { SourceLocation } from '@memolabs-apps/graph'
import type { DiscoveredRoute } from '@memolabs-apps/source'

/**
 * React's routes, read from the router configuration.
 *
 * A `path` literal is a fact. A `children` array is nested configuration and a
 * `lazy` or `import()` is a call, so neither is resolved into a path: concatenating
 * them would produce patterns that are right until a guard or a redirect changes
 * what the application does.
 *
 * This is the same reading the Angular adapter performs on its own routes file. Two
 * copies of a rule is the point at which the previous changes moved a helper into
 * the neutral core, and leaving it here is a deliberate exception: the next adapter
 * that needs it should move it, and until then the duplication is the evidence.
 */

/** Files this adapter reads routes from. */
export const ROUTES_FILE_PATTERN = /(?:\.routes|router|routes)\.[cm]?[jt]sx?$/

export function isRoutesFile(file: string): boolean {
  return ROUTES_FILE_PATTERN.test(file)
}

export interface FindingDraft {
  readonly code: string
  readonly title: string
  readonly message: string
  readonly file: string
}

export interface RouteReading {
  readonly routes: readonly DiscoveredRoute[]
  readonly findings: readonly FindingDraft[]
}

/** The URL a stated path serves, and the parameters in it. */
export function routePattern(path: string): {
  readonly pattern: string
  readonly params: readonly string[]
} {
  const params = [...path.matchAll(/:([A-Za-z_][\w]*)/g)].map((match) => match[1] ?? '')

  if (path === '' || path === '*') {
    return { pattern: '/', params: [] }
  }

  return { pattern: path.startsWith('/') ? path : `/${path}`, params }
}

export function readRoutes(file: string, text: string): RouteReading {
  const childrenIndex = text.indexOf('children:')
  const head = childrenIndex === -1 ? text : text.slice(0, childrenIndex)
  const routes: DiscoveredRoute[] = []
  const findings: FindingDraft[] = []

  for (const match of head.matchAll(/path\s*[:=]\s*['"`]([^'"`]*)['"`]/g)) {
    const path = match[1] ?? ''
    const { pattern, params } = routePattern(path)
    const source: SourceLocation = { file, adapterId: 'react' }

    routes.push({
      key: pattern,
      pathPattern: pattern,
      ...(params.length === 0 ? {} : { params }),
      source,
    })
  }

  if (childrenIndex !== -1) {
    findings.push({
      code: 'react-route-children',
      title: 'Nested routes were not resolved',
      message: `${file} declares children under a path. This adapter reads top level paths only, so the children produced no route.`,
      file,
    })
  }

  if (/\blazy\s*:|import\s*\(/.test(text)) {
    findings.push({
      code: 'react-lazy-route',
      title: 'A lazily loaded route was not resolved',
      message: `${file} loads a route lazily, which is a call rather than a path. It produced no route.`,
      file,
    })
  }

  return { routes: routes.sort((left, right) => left.key.localeCompare(right.key)), findings }
}
