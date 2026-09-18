import type { SourceLocation } from '@navirox/graph'
import type { DiscoveredRoute } from '@navirox/source'

/**
 * SvelteKit's routing, read from the filesystem.
 *
 * This is the one thing this adapter contributes. SvelteKit's contract is that a
 * page is a `+page.svelte` file under the routes directory and its URL is its
 * directory path, so a route can be established from a file that exists rather
 * than inferred from a convention a project happens to follow. That distinction
 * is the whole reason the Vue adapter refuses to produce routes and this one can.
 *
 * Everything else under the routes directory is reported and not turned into a
 * route: server pages, layouts, error pages and endpoint files are real files
 * with a meaning this adapter does not model.
 */

/** The directory SvelteKit reads routes from. */
export const ROUTES_DIR = 'src/routes'

/** The page file that makes a directory a route. */
export const PAGE_FILE = '+page.svelte'

/** Files under the routes directory that are not pages, and what they are. */
export const NON_PAGE_FILES: readonly { readonly suffix: string; readonly what: string }[] = [
  { suffix: '+page.server.ts', what: 'a server side page' },
  { suffix: '+page.server.js', what: 'a server side page' },
  { suffix: '+page.ts', what: 'a page load function' },
  { suffix: '+page.js', what: 'a page load function' },
  { suffix: '+layout.svelte', what: 'a layout' },
  { suffix: '+layout.ts', what: 'a layout load function' },
  { suffix: '+layout.server.ts', what: 'a server side layout' },
  { suffix: '+error.svelte', what: 'an error page' },
  { suffix: '+server.ts', what: 'a server endpoint' },
  { suffix: '+server.js', what: 'a server endpoint' },
]

/** True when the path is inside the routes directory. */
export function isRoutePath(file: string): boolean {
  return file.startsWith(`${ROUTES_DIR}/`)
}

/**
 * The URL a page file serves, and the parameters in it.
 *
 * A segment wrapped in brackets is a parameter in SvelteKit, including the
 * optional and rest forms, whose leading decorations are part of the syntax and
 * not part of the name a route exposes.
 */
export function routePattern(file: string): {
  readonly pattern: string
  readonly params: readonly string[]
} {
  const relative = file.slice(ROUTES_DIR.length + 1)
  const directory = relative.slice(0, relative.length - PAGE_FILE.length).replace(/\/$/, '')
  const params: string[] = []
  const segments = directory
    .split('/')
    .filter((segment) => segment.length > 0)
    .map((segment) => {
      const dynamic = /^\[{1,2}(?:\.\.\.)?(.+?)\]{1,2}$/.exec(segment)

      if (dynamic === null) {
        return segment
      }

      const name = dynamic[1] ?? segment
      params.push(name)
      return `:${name}`
    })

  return { pattern: segments.length === 0 ? '/' : `/${segments.join('/')}`, params }
}

/**
 * Reads the routes a project establishes.
 *
 * A page is a route. Anything else under the routes directory is a finding, so a
 * project with a server route or a layout sees that the adapter saw it, rather
 * than seeing a route count that quietly excludes it.
 */
export function readRoutes(files: readonly string[]): {
  readonly routes: DiscoveredRoute[]
  readonly findings: FindingDraft[]
} {
  const routes: DiscoveredRoute[] = []
  const findings: FindingDraft[] = []

  for (const file of files) {
    if (!isRoutePath(file)) {
      continue
    }

    const source: SourceLocation = { file, adapterId: 'sveltekit' }

    if (file.endsWith(PAGE_FILE)) {
      const { pattern, params } = routePattern(file)

      routes.push({
        key: pattern,
        pathPattern: pattern,
        ...(params.length === 0 ? {} : { params }),
        source,
      })

      continue
    }

    const known = NON_PAGE_FILES.find((entry) => file.endsWith(entry.suffix))

    findings.push(
      known === undefined
        ? {
            code: 'route-file-unmodelled',
            title: 'An unmodelled route file',
            message: `${file} sits under the routes directory and is not a page file this adapter models.`,
            source,
          }
        : {
            code: 'route-file-not-page',
            title: 'A route file that is not a page',
            message: `${file} is ${known.what}. This adapter reads pages only, so no route was produced from it.`,
            source,
          },
    )
  }

  return { routes, findings }
}

/** What a route file finding needs, before an adapter turns it into a `Finding`. */
export interface FindingDraft {
  readonly code: string
  readonly title: string
  readonly message: string
  readonly source: SourceLocation
}
