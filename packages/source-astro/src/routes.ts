import type { DiscoveredRoute } from '@memolabs-apps/source'

/**
 * Astro routes come from one directory, and that directory is a documented
 * contract rather than a convention: a file placed under `src/pages` becomes a
 * URL, and there is no routing configuration to read instead. The rules below
 * are the ones the framework documents, so they are read once here rather than
 * guessed per project.
 */
export const PAGES_DIR = 'src/pages'

/**
 * File extensions that become pages. Astro renders Markdown and MDX from the
 * same directory, so a `.md` file is a route whose body is prose: it is a page
 * this tool can name and not code it can read.
 */
export const PAGE_EXTENSIONS = ['.astro', '.md', '.mdx']

/** Astro builds an entry for any other file under `src/pages` as an endpoint. */
export const ENDPOINT_EXTENSIONS = ['.ts', '.js', '.mts', '.mjs', '.cjs', '.tsx', '.jsx']

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

function extensionOf(file: string): string {
  const name = file.slice(file.lastIndexOf('/') + 1)
  const dot = name.lastIndexOf('.')
  return dot <= 0 ? '' : name.slice(dot)
}

function stemOf(file: string): string {
  const name = file.slice(file.lastIndexOf('/') + 1)
  const dot = name.lastIndexOf('.')
  return dot <= 0 ? name : name.slice(0, dot)
}

/**
 * The path segments of a file below `src/pages`, or undefined when it is not
 * below that directory at all.
 */
export function pageSegments(file: string): readonly string[] | undefined {
  if (!file.startsWith(`${PAGES_DIR}/`)) {
    return undefined
  }
  return file.slice(PAGES_DIR.length + 1).split('/')
}

/**
 * A name the router ignores. The documentation is explicit: a file or directory
 * prefixed with an underscore is not placed into the build and is not a route.
 * That is how a project keeps a helper or a component next to the pages that
 * use it.
 */
export function isExcluded(segments: readonly string[]): boolean {
  return segments.some((segment) => segment.startsWith('_'))
}

/**
 * Turn path segments into a URL pattern, converting Astro's bracket syntax.
 * A segment may hold several parameters (`[lang]-[version]` becomes
 * `:lang-:version`), which is why the replacement runs over the whole segment
 * rather than over a whole-segment match.
 */
export function urlPattern(segments: readonly string[]): { pattern: string; params: string[] } {
  const params: string[] = []
  const kept = segments.map((segment) =>
    segment.replace(/\[{1,2}(?:\.\.\.)?(.+?)\]{1,2}/g, (_match, name: string) => {
      params.push(name)
      return `:${name}`
    }),
  )

  return { pattern: kept.length === 0 ? '/' : `/${kept.join('/')}`, params }
}

function route(file: string, segments: readonly string[]): DiscoveredRoute | undefined {
  const last = segments[segments.length - 1]
  if (last === undefined) {
    return undefined
  }

  const stem = stemOf(last)
  const directory = segments.slice(0, -1)
  const tail = stem === 'index' ? directory : [...directory, stem]
  const { pattern, params } = urlPattern(tail)

  return {
    key: pattern,
    pathPattern: pattern,
    ...(params.length === 0 ? {} : { params }),
    source: { file, adapterId: 'astro' },
  }
}

/**
 * Read every route the project's page directory establishes, the endpoint files
 * it builds instead of pages, and the one case where two files claim the same
 * URL.
 */
export function readRoutes(files: readonly string[]): RouteReading {
  const candidates: DiscoveredRoute[] = []
  const findings: FindingDraft[] = []

  for (const file of files) {
    const segments = pageSegments(file)
    if (segments === undefined || isExcluded(segments)) {
      continue
    }

    const extension = extensionOf(file)
    if (!PAGE_EXTENSIONS.includes(extension)) {
      if (ENDPOINT_EXTENSIONS.includes(extension)) {
        findings.push({
          code: 'astro-endpoint',
          title: 'Endpoint',
          message:
            'This file is built as an endpoint. It answers requests in a runtime the application does not ship, and this adapter does not model it.',
          file,
        })
      }
      continue
    }

    const discovered = route(file, segments)
    if (discovered !== undefined) {
      candidates.push(discovered)
    }
  }

  const byPattern = new Map<string, DiscoveredRoute[]>()
  for (const candidate of candidates) {
    const existing = byPattern.get(candidate.key)
    if (existing === undefined) {
      byPattern.set(candidate.key, [candidate])
    } else {
      existing.push(candidate)
    }
  }

  const routes: DiscoveredRoute[] = []
  for (const [pattern, group] of [...byPattern.entries()].sort((left, right) =>
    left[0].localeCompare(right[0]),
  )) {
    const [first, ...rest] = [...group].sort((left, right) =>
      left.source.file.localeCompare(right.source.file),
    )
    if (first !== undefined) {
      routes.push(first)
    }
    if (rest.length > 0) {
      const files = group.map((entry) => entry.source.file).sort()
      findings.push({
        code: 'astro-duplicate-route',
        title: 'Two files claim one route',
        message: `${files.join(' and ')} both establish ${pattern}. The route is reported once, for ${files[0] ?? ''}, and the other file is left for a human to resolve.`,
        file: files[0] ?? '',
      })
    }
  }

  return {
    routes: routes.sort((left, right) => left.key.localeCompare(right.key)),
    findings: findings.sort((left, right) => left.file.localeCompare(right.file)),
  }
}

/**
 * The files that run somewhere other than the application the migration
 * targets: endpoints, middleware, and the build configuration. They are named
 * in the report and left unread, which is the only honest treatment for code
 * whose runtime is a server.
 */
export function isServerSurface(file: string): boolean {
  const segments = pageSegments(file)
  if (segments !== undefined && !isExcluded(segments)) {
    const extension = extensionOf(file)
    return !PAGE_EXTENSIONS.includes(extension) && ENDPOINT_EXTENSIONS.includes(extension)
  }

  if (/^src\/middleware\.(ts|js|mts|mjs|cjs)$/.test(file)) {
    return true
  }

  return /^astro\.config\.(ts|js|mts|mjs|cjs)$/.test(file)
}
