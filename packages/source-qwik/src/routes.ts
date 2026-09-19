import type { SourceLocation } from '@memolabs-apps/graph'
import type { DiscoveredRoute } from '@memolabs-apps/source'
import { ADAPTER_ID } from './detect.js'

/**
 * Qwik City's route table.
 *
 * The framework documents its routing as a file system contract in `src/routes`,
 * and it documents three things that are not simply the tree: a folder wrapped in
 * parentheses is pathless, a named layout is selected by an `@name` suffix that
 * never reaches the URL, and `vite.config.ts` can declare `rewriteRoutes`, which
 * rewrites paths outside the file system entirely. A route table read as an
 * ordinary tree would be wrong in three different ways, so the first two are
 * followed here and the third is reported rather than guessed at.
 */

export const ROUTES_DIR = 'src/routes'

/** A page. Markdown is a page too, and it carries no application code. */
export const PAGE_EXTENSIONS: readonly string[] = ['.tsx', '.mdx', '.md']

/** A file with this extension under a route directory answers requests instead. */
export const ENDPOINT_EXTENSION = '.ts'

export const LAYOUT_PREFIX = 'layout'
export const PLUGIN_PREFIX = 'plugin'
export const NOT_FOUND_FILE = '404'

/** Where a project can declare route rewrites outside the file system. */
export const REWRITE_CONFIG_FILES: readonly string[] = [
  'vite.config.ts',
  'vite.config.mts',
  'vite.config.js',
  'vite.config.mjs',
]

export const ROUTE_REWRITE_DECLARATION = /\brewriteRoutes\b/

/**
 * The findings whose file is a runtime this adapter reports rather than reads.
 * The reading has already said it cannot model the file, so the file must not
 * come back as an application module in the same report.
 */
export const NOT_MODELLED_CODES: readonly string[] = [
  'qwik-not-found-page',
  'qwik-plugin',
  'qwik-endpoint',
  'qwik-unread-route-file',
]

export interface FindingDraft {
  readonly code: string
  readonly title: string
  readonly message: string
  readonly file: string
}

export interface LayoutDraft {
  readonly file: string
  readonly name: string
}

export interface RouteReading {
  readonly routes: readonly DiscoveredRoute[]
  readonly layouts: readonly LayoutDraft[]
  readonly findings: readonly FindingDraft[]
  /** Files the reading reported instead of reading, which are not units either. */
  readonly unmodelled: readonly string[]
}

/** The path under the routes directory, or nothing when the file is not in it. */
function segmentsOf(file: string): readonly string[] | undefined {
  if (!file.startsWith(`${ROUTES_DIR}/`)) {
    return undefined
  }

  const relative = file.slice(ROUTES_DIR.length + 1)

  return relative.length === 0 ? undefined : relative.split('/')
}

/** The last extension of a file name. */
function extensionOf(name: string): string | undefined {
  const at = name.lastIndexOf('.')

  return at <= 0 ? undefined : name.slice(at)
}

/** A name and the layout suffix it selects, which is never part of the path. */
function splitName(name: string): { bare: string; layout?: string } {
  const at = name.indexOf('@')

  return at === -1 ? { bare: name } : { bare: name.slice(0, at), layout: name.slice(at + 1) }
}

function draft(code: string, title: string, message: string, file: string): FindingDraft {
  return { code, title, message, file }
}

/**
 * The URL a list of route directory names describes.
 *
 * A folder in parentheses is a group: it names a layout for the files inside it
 * and contributes nothing to the path. A segment in brackets is a parameter, and
 * the ellipsis form is a parameter that matches whatever remains. An `@name`
 * suffix selects a named layout, so it is stripped wherever it appears.
 */
export function urlPattern(segments: readonly string[]): {
  pattern: string
  params: readonly string[]
} {
  const params: string[] = []

  const kept = segments
    .map((segment) => splitName(segment).bare)
    .filter((segment) => segment.length > 0 && !/^\(.+\)$/.test(segment))
    .map((segment) =>
      segment.replace(/\[{1,2}(?:\.\.\.)?(.+?)\]{1,2}/g, (_match, name: string) => {
        params.push(name)

        return `:${name}`
      }),
    )
    .filter((segment) => segment.length > 0)

  return { pattern: kept.length === 0 ? '/' : `/${kept.join('/')}`, params }
}

export function isRoutesFile(file: string): boolean {
  return segmentsOf(file) !== undefined
}

/**
 * Reads the pages, the layouts and the surface this adapter does not model.
 *
 * Two files can describe one path when a page selects a named layout or when a
 * folder is pathless, so a claimed path yields one route and the first file in
 * sorted order keeps it. The reading walks `files` sorted, which is what makes
 * that choice independent of the order the directories were visited in.
 */
export function readRoutes(
  files: readonly string[],
  readText: (file: string) => string | undefined,
): RouteReading {
  const routes: DiscoveredRoute[] = []
  const layouts: LayoutDraft[] = []
  const findings: FindingDraft[] = []
  const claimed = new Set<string>()

  for (const file of files) {
    const segments = segmentsOf(file)

    if (segments === undefined) {
      continue
    }

    const name = segments[segments.length - 1]

    if (name === undefined) {
      continue
    }

    const extension = extensionOf(name)

    if (extension === undefined) {
      continue
    }

    const stem = name.slice(0, name.length - extension.length)
    const directory = segments.slice(0, -1)
    const bare = splitName(stem).bare

    if (bare === LAYOUT_PREFIX || bare.startsWith(`${LAYOUT_PREFIX}-`)) {
      const suffix = bare.slice(LAYOUT_PREFIX.length)

      layouts.push({ file, name: suffix.startsWith('-') ? suffix.slice(1) : 'default' })

      continue
    }

    if (bare === NOT_FOUND_FILE) {
      findings.push(
        draft(
          'qwik-not-found-page',
          'A not found page',
          'This file renders when no route matches. It is generated outside the route table and this adapter does not model it.',
          file,
        ),
      )

      continue
    }

    if (bare === PLUGIN_PREFIX || bare.startsWith(`${PLUGIN_PREFIX}@`)) {
      findings.push(
        draft(
          'qwik-plugin',
          'A request plugin',
          'This file runs before any layout and in a runtime the browser does not own, and this adapter does not model it.',
          file,
        ),
      )

      continue
    }

    if (bare === 'index') {
      if (!PAGE_EXTENSIONS.includes(extension)) {
        findings.push(
          extension === ENDPOINT_EXTENSION
            ? draft(
                'qwik-endpoint',
                'An endpoint, not a page',
                'This file answers requests in a different runtime, and this adapter does not model it.',
                file,
              )
            : draft(
                'qwik-unread-route-file',
                'A route file this adapter does not read',
                'Qwik City documents folder names as the route table and a page as an index file, so this file is neither and is reported rather than assumed.',
                file,
              ),
        )

        continue
      }

      const { pattern, params } = urlPattern(directory)

      if (claimed.has(pattern)) {
        continue
      }

      claimed.add(pattern)

      const source: SourceLocation = { file, adapterId: ADAPTER_ID }

      routes.push({
        key: pattern,
        pathPattern: pattern,
        ...(params.length === 0 ? {} : { params }),
        source,
      })

      continue
    }

    findings.push(
      draft(
        'qwik-unread-route-file',
        'A route file this adapter does not read',
        'Qwik City documents folder names as the route table and a page as an index file, so this file is neither and is reported rather than assumed.',
        file,
      ),
    )
  }

  for (const file of REWRITE_CONFIG_FILES) {
    const text = readText(file)

    if (text !== undefined && ROUTE_REWRITE_DECLARATION.test(text)) {
      findings.push(
        draft(
          'qwik-route-rewrite',
          'Routes rewritten outside the file system',
          `${file} declares rewriteRoutes, which changes the paths the route table describes. This adapter reports the declaration instead of guessing at the paths it produces.`,
          file,
        ),
      )
    }
  }

  return {
    routes: routes.sort((left, right) => left.key.localeCompare(right.key)),
    layouts: layouts.sort((left, right) => left.file.localeCompare(right.file)),
    findings: findings.sort((left, right) => left.file.localeCompare(right.file)),
    unmodelled: [
      ...new Set(
        findings
          .filter((entry) => NOT_MODELLED_CODES.includes(entry.code))
          .map((entry) => entry.file),
      ),
    ].sort(),
  }
}
