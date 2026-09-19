import type { SourceLocation } from '@memolabs-apps/graph'
import type { DiscoveredRoute } from '@memolabs-apps/source'

/**
 * Next's two routers, read from the filesystem.
 *
 * Both are documented contracts rather than conventions a project happens to
 * follow, which is what makes them readable: a page file is a route, its directory
 * path is its URL, an index file is the directory itself, a bracketed segment is a
 * parameter and a parenthesised segment is a group that appears in the layout tree
 * but not in the URL.
 *
 * Both routers are read, and into one route set, because a project part way
 * through the migration has both. Reading only the App Router would under-report
 * every project that has not finished moving, and the report is for the project as
 * it is.
 */

/** The App Router directory, at the root or under `src`. */
export const APP_DIRS: readonly string[] = ['app', 'src/app']

/** The Pages Router directory, at the root or under `src`. */
export const PAGES_DIRS: readonly string[] = ['pages', 'src/pages']

/** A page file in the App Router. */
export const APP_PAGE = 'page'

/** A layout file in either router's tree. */
export const APP_LAYOUT = 'layout'

/** The extension set both routers use for their files. */
const EXTENSIONS = /\.(tsx|ts|jsx|js|mts|mjs)$/

export interface FindingDraft {
  readonly code: string
  readonly title: string
  readonly message: string
  readonly file: string
}

export interface RouteReading {
  readonly routes: readonly DiscoveredRoute[]
  readonly layouts: readonly string[]
  readonly findings: readonly FindingDraft[]
}

function under(file: string, directories: readonly string[]): string | undefined {
  return directories.find((directory) => file.startsWith(`${directory}/`))
}

/**
 * The URL a path serves, and the parameters in it.
 *
 * Group segments are dropped: `(marketing)` organises files and does not appear in
 * a URL. A bracketed segment becomes a parameter wherever it appears in a segment,
 * which is how `[slug]` and `post-[id]` are both read.
 */
export function urlPattern(segments: readonly string[]): {
  readonly pattern: string
  readonly params: readonly string[]
} {
  const params: string[] = []
  const kept = segments
    .filter((segment) => !/^\(.+\)$/.test(segment))
    .map((segment) =>
      segment.replace(/\[{1,2}(?:\.\.\.)?(.+?)\]{1,2}/g, (_match, name: string) => {
        params.push(name)
        return `:${name}`
      }),
    )
    .filter((segment) => segment.length > 0)

  return { pattern: kept.length === 0 ? '/' : `/${kept.join('/')}`, params }
}

function route(file: string, segments: readonly string[]): DiscoveredRoute {
  const { pattern, params } = urlPattern(segments)
  const source: SourceLocation = { file, adapterId: 'next' }

  return {
    key: pattern,
    pathPattern: pattern,
    ...(params.length === 0 ? {} : { params }),
    source,
  }
}

/** True when the file is a page or a layout in either router. */
export function isPageOrLayout(file: string): boolean {
  const app = under(file, APP_DIRS)

  if (app !== undefined && EXTENSIONS.test(file)) {
    const name =
      file
        .slice(app.length + 1)
        .split('/')
        .at(-1) ?? ''
    const stem = name.replace(EXTENSIONS, '')

    return stem === APP_PAGE || stem === APP_LAYOUT
  }

  const pages = under(file, PAGES_DIRS)

  if (pages === undefined || !EXTENSIONS.test(file)) {
    return false
  }

  const tail = file.slice(pages.length + 1)

  // `pages/api` is the server surface, and `_app`, `_document` and `_error` are
  // framework files rather than routes.
  if (tail === 'api' || tail.startsWith('api/')) {
    return false
  }

  const name = tail.split('/').at(-1) ?? ''

  return name.length > 0 && !name.startsWith('_')
}

/**
 * Reads routes, layouts and the files that are not routes.
 *
 * A layout is not a route, an API route is not a route, and each one is reported
 * so that a reader sees what the adapter saw rather than a route count that
 * quietly excludes it.
 */
export function readRoutes(files: readonly string[]): RouteReading {
  const routes: DiscoveredRoute[] = []
  const layouts: string[] = []
  const findings: FindingDraft[] = []

  for (const file of files) {
    const app = under(file, APP_DIRS)

    if (app !== undefined && EXTENSIONS.test(file)) {
      const segments = file.slice(app.length + 1).split('/')
      const name = segments.at(-1) ?? ''
      const stem = name.replace(EXTENSIONS, '')

      if (stem === APP_PAGE) {
        routes.push(route(file, segments.slice(0, -1)))
        continue
      }

      if (stem === APP_LAYOUT) {
        layouts.push(file)
        continue
      }

      if (stem === 'route' || stem === 'default' || stem === 'template') {
        findings.push({
          code: 'next-server-file',
          title: 'A route file that is not a page',
          message: `${file} is a ${stem} file. It is not a page, so it produced no route.`,
          file,
        })
        continue
      }

      continue
    }

    const pages = under(file, PAGES_DIRS)

    if (pages === undefined || !EXTENSIONS.test(file)) {
      continue
    }

    const tail = file.slice(pages.length + 1)
    const name = tail.split('/').at(-1) ?? ''

    if (tail === 'api' || tail.startsWith('api/')) {
      findings.push({
        code: 'next-api-route',
        title: 'An API route',
        message: `${file} is a Pages Router API route. It runs on the server and produced no route.`,
        file,
      })
      continue
    }

    if (name.startsWith('_')) {
      findings.push({
        code: 'next-pages-special',
        title: 'A framework file in the pages directory',
        message: `${file} is a framework file rather than a route, so it produced no route.`,
        file,
      })
      continue
    }

    routes.push(route(file, tail.replace(EXTENSIONS, '').split('/')))
  }

  return {
    routes: routes.sort((left, right) => left.key.localeCompare(right.key)),
    layouts: layouts.sort(),
    findings: findings.sort((left, right) => left.file.localeCompare(right.file)),
  }
}

/** The files that are the server surface rather than application code. */
export function isServerSurface(file: string): boolean {
  if (under(file, APP_DIRS) !== undefined && /\/route\.(tsx|ts|jsx|js|mts|mjs)$/.test(file)) {
    return true
  }

  const pages = under(file, PAGES_DIRS)

  if (pages !== undefined && file.slice(pages.length + 1).startsWith('api/')) {
    return true
  }

  return (
    /^middleware\.(ts|js|mts|mjs)$/.test(file) || /^next\.config\.(ts|js|mjs|mts|cjs)$/.test(file)
  )
}
