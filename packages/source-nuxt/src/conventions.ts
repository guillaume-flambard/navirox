import type { SourceLocation } from '@navirox/graph'
import type { DiscoveredRoute, DiscoveredUnit } from '@navirox/source'
import { ADAPTER_ID } from './detect.js'

/**
 * What Nuxt adds: directories that mean something.
 *
 * Nuxt's routing, layouts and composables are conventions, not configuration, so
 * a route can be established from a file that exists. That is the same standard
 * the SvelteKit adapter holds itself to and the same reason the Vue adapter
 * refuses to produce routes: a directory a project happens to use is not a
 * contract, and a directory the framework documents is.
 *
 * Everything else Nuxt offers is a different runtime, and it is reported rather
 * than modelled, because this adapter has no reading of the server.
 */

export const PAGES_DIR = 'src/pages'

/** Nuxt reads pages from the project root as well as from `src`. */
export const ALT_PAGES_DIR = 'pages'

export const LAYOUTS_DIRS: readonly string[] = ['src/layouts', 'layouts']

/** Directories whose contents are a different runtime, reported and not modelled. */
export const SERVER_SURFACE: readonly {
  readonly dir: string
  readonly code: string
  readonly what: string
}[] = [
  { dir: 'server', code: 'nuxt-server-code', what: 'server code' },
  { dir: 'src/server', code: 'nuxt-server-code', what: 'server code' },
  { dir: 'plugins', code: 'nuxt-plugin', what: 'a plugin' },
  { dir: 'src/plugins', code: 'nuxt-plugin', what: 'a plugin' },
  { dir: 'middleware', code: 'nuxt-middleware', what: 'middleware' },
  { dir: 'src/middleware', code: 'nuxt-middleware', what: 'middleware' },
]

/** The configuration files the adapter reads nothing from. */
export const CONFIG_FILES: readonly string[] = ['nuxt.config.ts', 'nuxt.config.js']

function underDirectory(file: string, directories: readonly string[]): string | undefined {
  return directories.find((directory) => file.startsWith(`${directory}/`))
}

/**
 * The URL a page file serves, and the parameters in it.
 *
 * A page is a `.vue` file under the pages directory, its directory path is its
 * URL, `index` is the directory itself, and a bracketed segment is a parameter
 * wherever it appears in a segment, which is how a file like `user-[id].vue`
 * becomes `/user-:id`.
 */
export function pagePattern(
  file: string,
  pagesDir: string,
): {
  readonly pattern: string
  readonly params: readonly string[]
} {
  const relative = file.slice(pagesDir.length + 1).replace(/\.vue$/, '')
  const segments = relative.split('/')

  if (segments.at(-1) === 'index') {
    segments.pop()
  }

  const params: string[] = []
  const pattern = segments
    .map((segment) =>
      segment.replace(/\[{1,2}(?:\.\.\.)?(.+?)\]{1,2}/g, (_match, name: string) => {
        params.push(name)
        return `:${name}`
      }),
    )
    .join('/')

  return { pattern: pattern === '' ? '/' : `/${pattern}`, params }
}

/** The routes a project establishes, from the pages files it has. */
export function readRoutes(files: readonly string[]): readonly DiscoveredRoute[] {
  const routes: DiscoveredRoute[] = []

  for (const file of files) {
    const pagesDir = underDirectory(file, [PAGES_DIR, ALT_PAGES_DIR])

    if (pagesDir === undefined || !file.endsWith('.vue')) {
      continue
    }

    const { pattern, params } = pagePattern(file, pagesDir)
    const source: SourceLocation = { file, adapterId: ADAPTER_ID }

    routes.push({
      key: pattern,
      pathPattern: pattern,
      ...(params.length === 0 ? {} : { params }),
      source,
    })
  }

  return routes.sort((left, right) => left.key.localeCompare(right.key))
}

/**
 * Layouts and composables as units.
 *
 * Both are application code with a source location, and the graph has the kinds
 * for them. Reporting them as findings would have said the adapter could not read
 * them, which is false, and would have hidden the largest body of portable code
 * in a typical Nuxt project.
 */
export function readUnits(files: readonly string[]): readonly DiscoveredUnit[] {
  const units: DiscoveredUnit[] = []

  for (const file of files) {
    const layoutDir = underDirectory(file, LAYOUTS_DIRS)

    if (layoutDir !== undefined && file.endsWith('.vue')) {
      units.push({
        key: 'default',
        kind: 'layout',
        name: file.slice(layoutDir.length + 1).replace(/\.vue$/, ''),
        source: { file, adapterId: ADAPTER_ID, start: { line: 1, column: 1 } },
      })

      continue
    }

    // Composables are application modules, and the neutral predicate the base
    // adapter applies already reports them. A rule here would report each of them
    // twice under two identifiers, which is the duplication composition exists to
    // remove.
  }

  return units.sort((left, right) => left.source.file.localeCompare(right.source.file))
}

/** The files this adapter read nothing from, so the user can see the edge. */
export function readUnmodelled(
  files: readonly string[],
): readonly { readonly code: string; readonly what: string; readonly file: string }[] {
  const found: { code: string; what: string; file: string }[] = []

  for (const file of files) {
    const surface = SERVER_SURFACE.find((entry) => file.startsWith(`${entry.dir}/`))

    if (surface !== undefined) {
      found.push({ code: surface.code, what: surface.what, file })
      continue
    }

    if (CONFIG_FILES.includes(file)) {
      found.push({ code: 'nuxt-runtime-config', what: 'the runtime configuration', file })
    }
  }

  return found.sort((left, right) => left.file.localeCompare(right.file))
}
