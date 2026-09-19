import type { DiscoveredRoute } from '@memolabs-apps/source'
import { ADAPTER_ID } from './detect.js'

/**
 * A declared path is a fact; a nested children array, a lazy import and a
 * computed path are calls this adapter does not resolve.
 *
 * The router documents two shapes for one table of routes: JSX route elements
 * and the object form of `defineRoutes` or `createRouter`. Both are read here,
 * because a project picks one and reading only the other would report a project
 * with no routes at all. This is the same textual reading the Angular and React
 * adapters use, and the same acknowledged duplication: it belongs in the neutral
 * package once a fourth adapter needs it.
 */

export const ROUTES_FILE_PATTERN = /(?:\.routes|router|routes)\.[cm]?[jt]sx?$/

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

const PATH_LITERAL = /\bpath\s*[:=]\s*(['"`])([^'"`]*)\1/g

const PATH_NOT_LITERAL = /\bpath\s*[:=]\s*(?!\s*['"`])/

const PARAMETER = /:(\w+)/g

export function isRoutesFile(file: string): boolean {
  return ROUTES_FILE_PATTERN.test(file)
}

function paramsOf(pattern: string): readonly string[] {
  const params: string[] = []

  for (const match of pattern.matchAll(PARAMETER)) {
    const name = match[1]

    if (name !== undefined) {
      params.push(name)
    }
  }

  return params
}

/**
 * The pattern a declared path serves.
 *
 * A wildcard matches a part of the tree rather than naming it, and the neutral
 * model has no catch-all, so a path that is only a wildcard is the root route
 * and a wildcard segment inside a longer path is dropped from the pattern and
 * reported instead of being written into it.
 */
export function routePattern(path: string): string {
  const trimmed = path.trim()

  if (trimmed === '' || trimmed.startsWith('*')) {
    return '/'
  }

  const withSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  const segments = withSlash.split('/').filter((segment) => segment !== '')
  const kept = segments.filter((segment) => !segment.startsWith('*'))

  return kept.length === 0 ? '/' : `/${kept.join('/')}`
}

export function hasWildcardSegment(path: string): boolean {
  return path.split('/').some((segment) => segment.startsWith('*') && segment !== '')
}

export function readRoutes(file: string, text: string): RouteReading {
  const routes: DiscoveredRoute[] = []
  const findings: FindingDraft[] = []
  const head = text.split('children:')[0] ?? text

  for (const match of head.matchAll(PATH_LITERAL)) {
    const declared = match[2]

    if (declared === undefined) {
      continue
    }

    const pattern = routePattern(declared)

    if (hasWildcardSegment(declared) && pattern === '/') {
      findings.push({
        code: 'solid-wildcard-route',
        title: 'A wildcard route is not modelled',
        message: `The route declared for ${file} matches a wildcard, which the neutral model cannot express, so it is reported rather than written into the pattern.`,
        file,
      })

      continue
    }

    const params = paramsOf(pattern)

    routes.push({
      key: pattern,
      pathPattern: pattern,
      ...(params.length === 0 ? {} : { params }),
      source: { file, adapterId: ADAPTER_ID },
    })
  }

  if (text.includes('children:')) {
    findings.push({
      code: 'solid-route-children',
      title: 'Nested routes were not resolved',
      message: `The routes declared inside children in ${file} are not read, because resolving them means following a component tree this adapter does not parse.`,
      file,
    })
  }

  if (/\blazy\s*\(|\bimport\s*\(/.test(text)) {
    findings.push({
      code: 'solid-lazy-route',
      title: 'A lazily loaded route was not resolved',
      message: `${file} loads a route through a dynamic import, so the component behind it is a separate module this adapter reads as a module rather than as a destination.`,
      file,
    })
  }

  if (PATH_NOT_LITERAL.test(text)) {
    findings.push({
      code: 'solid-route-path-not-literal',
      title: 'A route path is not a literal',
      message: `${file} declares a path this adapter cannot read, so the routes that depend on it are missing rather than guessed.`,
      file,
    })
  }

  return {
    routes: routes.sort((left, right) => left.key.localeCompare(right.key)),
    findings,
  }
}
