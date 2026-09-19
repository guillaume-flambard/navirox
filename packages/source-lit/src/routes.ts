import type { DiscoveredRoute } from '@memolabs-apps/source'
import { stripComments } from '@memolabs-apps/source'
import { ADAPTER_ID } from './detect.js'

/**
 * Lit ships no router. The labs package documents one as reactive controllers, configured in code
 * with `path` strings, and its own README warns that it may change or stop being supported. So the
 * route table is whatever a project declares, and there is nothing else to read: no file
 * convention, no manifest field, and no reason to infer a table from a directory layout.
 *
 * Two shapes cannot be resolved as a path and are reported instead of guessed. A route configured
 * with a `URLPattern` object is a pattern the adapter would have to evaluate, and an `enter`
 * callback is work the router does before rendering. A project that never configures the labs
 * router declares no routes, and that is reported as nothing rather than as a defect.
 */

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

const ROUTER_CONFIGURATION = /\bnew\s+(?:Routes|Router)\s*\(/
const PATH_LITERAL = /\bpath\s*:\s*['"`]([^'"`]+)['"`]/g
const URL_PATTERN_ROUTE = /\bpattern\s*:\s*new\s+URLPattern\b/
const ENTER_CALLBACK = /\benter\s*:\s*(?:async\s*)?\(/

function parametersOf(pattern: string): string[] {
  const names: string[] = []

  for (const match of pattern.matchAll(/:([A-Za-z_$][\w$]*)/g)) {
    const name = match[1]

    if (name !== undefined) {
      names.push(name)
    }
  }

  return names
}

export function routePattern(path: string): string {
  if (path.length === 0 || path === '*') {
    return '/'
  }

  return path.startsWith('/') ? path : `/${path}`
}

/** Only a file that configures the labs router can declare routes. */
export function configuresRouter(text: string): boolean {
  return ROUTER_CONFIGURATION.test(stripComments(text))
}

export function readRoutes(
  files: readonly string[],
  readText: (file: string) => string | undefined,
): RouteReading {
  const routes: DiscoveredRoute[] = []
  const findings: FindingDraft[] = []
  const claimed = new Set<string>()

  for (const file of files) {
    const text = readText(file)

    if (text === undefined) {
      continue
    }

    const source = stripComments(text)

    if (!ROUTER_CONFIGURATION.test(source)) {
      continue
    }

    let read = 0

    for (const match of source.matchAll(PATH_LITERAL)) {
      const literal = match[1]

      if (literal === undefined) {
        continue
      }

      read += 1
      const pattern = routePattern(literal)

      if (claimed.has(pattern)) {
        continue
      }

      claimed.add(pattern)
      const params = parametersOf(pattern)
      routes.push({
        key: pattern,
        pathPattern: pattern,
        ...(params.length === 0 ? {} : { params }),
        source: { file, adapterId: ADAPTER_ID },
      })
    }

    if (read === 0) {
      findings.push({
        code: 'lit-route-none-read',
        title: 'A router configuration with no path read',
        message:
          'This file configures the labs router and declares no path the adapter could read as a string.',
        file,
      })
    }

    if (URL_PATTERN_ROUTE.test(source)) {
      findings.push({
        code: 'lit-route-pattern-object',
        title: 'A route declared as a URLPattern',
        message:
          'This route is configured with a URLPattern object. Evaluating it would be a guess, so the adapter reports it rather than a path pattern.',
        file,
      })
    }

    if (ENTER_CALLBACK.test(source)) {
      findings.push({
        code: 'lit-route-enter',
        title: 'A route with an enter callback',
        message:
          'This router configuration declares an enter callback. The adapter does not resolve the work it does before rendering.',
        file,
      })
    }
  }

  routes.sort((left, right) => left.key.localeCompare(right.key))
  findings.sort((left, right) => (left.file + left.code).localeCompare(right.file + right.code))

  return { routes, findings }
}
