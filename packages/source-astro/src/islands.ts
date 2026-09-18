import type { FindingDraft } from './routes.js'

/**
 * The integrations Astro ships for UI frameworks, and the framework each one
 * brings. This is the list of what a project can put on a page; it is data, so
 * a new integration is a line rather than a branch.
 */
export const FRAMEWORK_INTEGRATIONS: Readonly<Record<string, string>> = {
  '@astrojs/vue': 'vue',
  '@astrojs/react': 'react',
  '@astrojs/svelte': 'svelte',
  '@astrojs/preact': 'preact',
  '@astrojs/solid-js': 'solid',
  '@astrojs/alpinejs': 'alpinejs',
}

/**
 * The frameworks whose files this adapter can hand to an adapter of their own.
 * Anything outside it is named in the report and left alone.
 */
export const READABLE_FRAMEWORKS = ['vue', 'react', 'svelte']

/** Frameworks that share the JSX extensions, which Astro asks a project to disambiguate. */
export const JSX_FRAMEWORKS = ['react', 'preact', 'solid']

/** The hydration directives Astro documents, and the ones this adapter reads. */
export const HYDRATION_DIRECTIVES = ['load', 'idle', 'visible', 'media', 'only']

const FRAMEWORK_BY_EXTENSION: Readonly<Record<string, string>> = {
  '.vue': 'vue',
  '.svelte': 'svelte',
  '.tsx': 'react',
  '.jsx': 'react',
}

const RESOLUTION_EXTENSIONS = ['.vue', '.svelte', '.tsx', '.jsx', '.astro', '.ts', '.js', '.mjs']

export interface IslandReading {
  readonly component: string
  readonly directive: string
  readonly framework?: string
  readonly file?: string
}

export interface IslandReadingResult {
  readonly islands: readonly IslandReading[]
  readonly findings: readonly FindingDraft[]
}

interface Imports {
  readonly byLocalName: Map<string, string>
}

function frontmatterOf(text: string): string {
  if (!text.startsWith('---')) {
    return ''
  }
  const end = text.indexOf('\n---', 3)
  return end === -1 ? text : text.slice(3, end)
}

function importsOf(frontmatter: string): Imports {
  const byLocalName = new Map<string, string>()
  const pattern =
    /^\s*import\s+(?:([A-Za-z_$][\w$]*)\s*,?\s*)?(?:\{([^}]*)\})?\s*from\s*['"]([^'"]+)['"]/gm

  for (const match of frontmatter.matchAll(pattern)) {
    const [, defaultName, named, specifier] = match
    if (defaultName !== undefined && defaultName.length > 0 && specifier !== undefined) {
      byLocalName.set(defaultName, specifier)
    }
    if (named !== undefined && specifier !== undefined) {
      for (const entry of named.split(',')) {
        const parts = entry.trim().split(/\s+as\s+/)
        const imported = parts[0]?.trim()
        const local = (parts[1] ?? parts[0])?.trim()
        if (imported !== undefined && imported.length > 0 && local !== undefined) {
          byLocalName.set(local, specifier)
        }
      }
    }
  }

  return { byLocalName }
}

function directoryOf(file: string): string {
  const index = file.lastIndexOf('/')
  return index === -1 ? '' : file.slice(0, index)
}

function normalize(segments: readonly string[]): string {
  const out: string[] = []
  for (const segment of segments) {
    if (segment === '' || segment === '.') {
      continue
    }
    if (segment === '..') {
      out.pop()
      continue
    }
    out.push(segment)
  }
  return out.join('/')
}

/**
 * Resolve an import specifier to a file in the project, or undefined when it
 * points somewhere this project does not contain (a package, most often).
 */
export function resolveImport(
  file: string,
  specifier: string,
  files: readonly string[],
): string | undefined {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
    return undefined
  }

  const base = normalize([...directoryOf(file).split('/'), ...specifier.split('/')])
  const known = new Set(files)

  if (known.has(base)) {
    return base
  }

  for (const extension of RESOLUTION_EXTENSIONS) {
    if (known.has(`${base}${extension}`)) {
      return `${base}${extension}`
    }
    if (known.has(`${base}/index${extension}`)) {
      return `${base}/index${extension}`
    }
  }

  return undefined
}

/**
 * Read the hydration directives of one `.astro` file. A directive is the whole
 * of what makes a framework component interactive: without one, the component
 * is rendered to HTML on the server and no code for its framework reaches the
 * browser. Each directive is recorded on the file that carries it, and the
 * component behind it is resolved so the adapter of its framework can be asked
 * to read it.
 */
export function readIslands(
  file: string,
  text: string,
  files: readonly string[],
): IslandReadingResult {
  const imports = importsOf(frontmatterOf(text))
  const islands: IslandReading[] = []
  const findings: FindingDraft[] = []
  const tagPattern = /<([A-Z][A-Za-z0-9_$.]*)\b([^>]*)>/g

  for (const tag of text.matchAll(tagPattern)) {
    const [, component, attributes] = tag
    if (component === undefined || attributes === undefined) {
      continue
    }

    const directivePattern = new RegExp(
      `client:(${HYDRATION_DIRECTIVES.join('|')})(?:\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{([^}]*)\\}))?`,
      'g',
    )

    for (const directive of attributes.matchAll(directivePattern)) {
      const [, name] = directive
      if (name === undefined) {
        continue
      }
      const value = directive[2] ?? directive[3] ?? directive[4]

      const specifier = imports.byLocalName.get(component)
      const target = specifier === undefined ? undefined : resolveImport(file, specifier, files)

      if (target === undefined) {
        findings.push({
          code: 'astro-island-unresolved',
          title: 'Island without a component this project owns',
          message: `<${component} client:${name}${value === undefined ? '' : `="${value}"`}> was seen and could not be attributed to a file in this project. The island is recorded and left for a human, because guessing its framework would read it with rules that may not be its own.`,
          file,
        })
        continue
      }

      const extension = target.slice(target.lastIndexOf('.'))
      if (extension === '.astro') {
        findings.push({
          code: 'astro-island-not-hydratable',
          title: 'An Astro component cannot be hydrated',
          message: `<${component}> resolves to ${target}, and Astro rejects a client directive on an Astro component: those are HTML-only and carry no client runtime.`,
          file,
        })
        continue
      }

      const framework = FRAMEWORK_BY_EXTENSION[extension]
      islands.push({
        component,
        directive: `client:${name}`,
        ...(framework === undefined ? {} : { framework }),
        file: target,
      })
    }
  }

  return {
    islands,
    findings: findings.sort((left, right) => left.file.localeCompare(right.file)),
  }
}

/**
 * Name the integrations the project installs for frameworks this adapter cannot
 * read, and the one case Astro itself asks a project to disambiguate: several
 * JSX frameworks share `.tsx` and `.jsx`, so a file with one of those
 * extensions cannot be attributed to a framework from its name alone.
 */
export function readIntegrations(dependencies: readonly string[]): readonly FindingDraft[] {
  const findings: FindingDraft[] = []
  const installed = new Map<string, string>()

  for (const dependency of dependencies) {
    const framework = FRAMEWORK_INTEGRATIONS[dependency]
    if (framework === undefined) {
      continue
    }
    installed.set(dependency, framework)
    if (!READABLE_FRAMEWORKS.includes(framework)) {
      findings.push({
        code: 'astro-unread-integration',
        title: 'An integration Navirox cannot read',
        message: `${dependency} brings ${framework} to this project and Navirox has no ${framework} adapter, so those components are named and not read. Reading them with an adapter for another framework would report a shape that is not theirs.`,
        file: 'package.json',
      })
    }
  }

  const jsxFrameworks = [...installed.values()].filter((framework) =>
    JSX_FRAMEWORKS.includes(framework),
  )
  if (jsxFrameworks.length > 1) {
    findings.push({
      code: 'astro-ambiguous-jsx',
      title: 'Several JSX frameworks share one extension',
      message: `${jsxFrameworks.join(' and ')} are installed together, and they both use .tsx and .jsx. Astro asks a project to say which one it means, and this adapter will not decide for it.`,
      file: 'package.json',
    })
  }

  return findings
}
