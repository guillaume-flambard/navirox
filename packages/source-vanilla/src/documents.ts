import type { SourceLocation } from '@memolabs-apps/graph'
import type { DiscoveredRoute } from '@memolabs-apps/source'
import { isDocument } from './detect.js'

/**
 * A document is addressable in a way no framework convention is: a static host serves
 * `about.html` at `/about.html`. That is a property of serving files rather than a routing
 * convention somebody documented, which is why it can be read.
 *
 * A document also names the module it runs, through the `src` of a script element. That link is
 * read, because it is the one place a frameworkless project says which code belongs to which
 * page, and because the neutral predicate for an application module deliberately skips entry
 * file names, which is exactly what a document loads.
 *
 * Two things are still not read. A dev server that rewrites `/about` onto `about.html` is a
 * project's configuration and not a fact this adapter can see, so the route keeps the file's own
 * address. A `script` element with a body rather than a `src` is code living inside a document,
 * and it is reported rather than parsed, because a document is not a module.
 */

export interface FindingDraft {
  readonly code: string
  readonly title: string
  readonly message: string
  readonly file: string
}

export interface DocumentScript {
  readonly document: string
  readonly module: string
}

export interface DocumentReading {
  readonly routes: readonly DiscoveredRoute[]
  readonly scripts: readonly DocumentScript[]
  readonly findings: readonly FindingDraft[]
}

const SCRIPT_TAG = /<script\b([^>]*)>/gi
const SCRIPT_SRC = /\bsrc\s*=\s*['"]([^'"]+)['"]/i
const INLINE_SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
const REMOTE = /^(?:[a-z][a-z0-9+.-]*:)?\/\//i

/** The path a document is served at, with `index.html` naming the directory it sits in. */
export function documentPattern(file: string): string {
  const stem = file.replace(/\.html?$/i, '')
  const segments = stem.split('/').filter((segment) => segment.length > 0)
  const last = segments[segments.length - 1]

  if (last === 'index') {
    const named = segments.slice(0, -1)
    return named.length === 0 ? '/' : `/${named.join('/')}`
  }

  return segments.length === 0 ? '/' : `/${segments.join('/')}.html`
}

function normalize(path: string): string {
  const segments: string[] = []

  for (const segment of path.split('/')) {
    if (segment === '' || segment === '.') {
      continue
    }

    if (segment === '..') {
      segments.pop()
      continue
    }

    segments.push(segment)
  }

  return segments.join('/')
}

/**
 * The project file a document's script points at, when it points at one. A script loaded from
 * somewhere else, or one naming a file this project does not contain, resolves to nothing rather
 * than to a guess.
 */
export function resolveDocumentModule(
  document: string,
  src: string,
  files: readonly string[],
): string | undefined {
  let path = src

  if (REMOTE.test(path)) {
    return undefined
  }

  if (path.startsWith('/')) {
    path = path.replace(/^\/+/, '')
  } else {
    const directory = document.includes('/') ? document.slice(0, document.lastIndexOf('/')) : ''
    path = directory === '' ? path : `${directory}/${path}`
  }

  const normalized = normalize(path)

  return files.includes(normalized) ? normalized : undefined
}

function hasInlineScript(text: string): boolean {
  for (const match of text.matchAll(INLINE_SCRIPT)) {
    const attributes = match[1] ?? ''
    const body = match[2] ?? ''

    if (!SCRIPT_SRC.test(attributes) && body.trim().length > 0) {
      return true
    }
  }

  return false
}

function scriptSources(text: string): readonly string[] {
  const sources: string[] = []

  for (const match of text.matchAll(SCRIPT_TAG)) {
    const found = SCRIPT_SRC.exec(match[1] ?? '')

    if (found?.[1] !== undefined) {
      sources.push(found[1])
    }
  }

  return sources
}

export function readDocuments(
  files: readonly string[],
  readText: (file: string) => string | undefined,
): DocumentReading {
  const routes: DiscoveredRoute[] = []
  const scripts: DocumentScript[] = []
  const findings: FindingDraft[] = []

  for (const file of files) {
    if (!isDocument(file)) {
      continue
    }

    const pattern = documentPattern(file)
    const source: SourceLocation = { file, adapterId: 'vanilla' }

    routes.push({ key: pattern, pathPattern: pattern, source })

    const text = readText(file)

    if (text === undefined) {
      continue
    }

    for (const src of scriptSources(text)) {
      const module = resolveDocumentModule(file, src, files)

      if (module !== undefined) {
        scripts.push({ document: file, module })
      }
    }

    if (hasInlineScript(text)) {
      findings.push({
        code: 'vanilla-inline-script',
        title: 'Code inside a document',
        message:
          'A script element carries its own body, so the code lives in the document rather than in a module. This adapter reads modules, and it reports what it cannot read instead of parsing a document as source.',
        file,
      })
    }
  }

  return {
    routes: routes.sort((left, right) => left.key.localeCompare(right.key)),
    scripts: scripts.sort(
      (left, right) =>
        left.document.localeCompare(right.document) || left.module.localeCompare(right.module),
    ),
    findings: findings.sort((left, right) => left.file.localeCompare(right.file)),
  }
}
