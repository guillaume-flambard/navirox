import type { SourceLocation } from '@memolabs-apps/graph'
import type { DiscoveredRoute, DiscoveredUnit } from '@memolabs-apps/source'
import { dirname, join, normalize } from 'node:path/posix'
import * as ts from 'typescript'
import { ADAPTER_ID } from './detect.js'

/**
 * What Nuxt adds: directories that mean something, and a macro that says what a
 * page needs.
 *
 * Nuxt's routing is a convention, not configuration, so a route can be
 * established from a file that exists. That is the same standard the SvelteKit
 * adapter holds itself to and the same reason the Vue adapter refuses to produce
 * routes: a directory a project happens to use is not a contract, and a directory
 * the framework documents is.
 *
 * Nuxt 4 documents `app/` for the application while `server/` stays at the project
 * root, so the current root and the older ones are all read. Everything under
 * `server/` is a different runtime and is reported rather than modelled, because
 * this adapter has no reading of the server and the framework's own documentation
 * tells a project not to import across that line.
 */

/** The directory Nuxt 4 documents for the application. */
export const APP_DIR = 'app'

export const PAGES_DIR = 'src/pages'

/** Nuxt reads pages from the project root as well as from `src`. */
export const ALT_PAGES_DIR = 'pages'

export const APP_PAGES_DIR = 'app/pages'

/** Every directory a page can live in. Nuxt 4 moved this under `app`. */
export const PAGES_DIRS: readonly string[] = [PAGES_DIR, ALT_PAGES_DIR, APP_PAGES_DIR]

export const LAYOUTS_DIRS: readonly string[] = ['src/layouts', 'layouts', 'app/layouts']

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
  { dir: 'app/plugins', code: 'nuxt-plugin', what: 'a plugin' },
  { dir: 'middleware', code: 'nuxt-middleware', what: 'middleware' },
  { dir: 'src/middleware', code: 'nuxt-middleware', what: 'middleware' },
  { dir: 'app/middleware', code: 'nuxt-middleware', what: 'middleware' },
]

/** The configuration files the adapter reads nothing from. */
export const CONFIG_FILES: readonly string[] = ['nuxt.config.ts', 'nuxt.config.js']

/**
 * The application config file, which is a different thing from the runtime one.
 *
 * `nuxt.config` may hold secrets and `app.config` is published to the client
 * bundle by design, so the framework's own rule about the two is opposite. They
 * are reported under two codes for that reason.
 */
export const APP_CONFIG_FILES: readonly string[] = [
  'app/app.config.ts',
  'app/app.config.js',
  'app/app.config.mjs',
  'src/app.config.ts',
  'src/app.config.js',
  'src/app.config.mjs',
  'app.config.ts',
  'app.config.js',
  'app.config.mjs',
]

/**
 * The two halves of a component.
 *
 * A `.server.vue` component renders on the server only (Nuxt calls them islands),
 * and a `.client.vue` component renders on the client only. When both files
 * exist they are two halves of one component rather than two components, and the
 * adapter does not merge them: merging would hide that half of it runs somewhere
 * the target does not.
 */
export const SERVER_COMPONENT_SUFFIX = '.server.vue'
export const CLIENT_COMPONENT_SUFFIX = '.client.vue'

/** A reading the adapter could not make, so the user can see the edge. */
export interface FindingDraft {
  readonly code: string
  readonly title: string
  readonly message: string
  readonly file: string
}

/** What a page says about itself through `definePageMeta`. */
export interface PageMetadata {
  readonly name?: string
  readonly key?: string
  readonly layout?: string | false
  readonly middleware: readonly string[]
  readonly path?: string
  readonly aliases: readonly string[]
}

export interface PageReading {
  readonly routes: readonly DiscoveredRoute[]
  readonly pages: readonly { readonly file: string; readonly metadata: PageMetadata }[]
  readonly findings: readonly FindingDraft[]
}

interface ModuleRouteReading {
  readonly routes: readonly DiscoveredRoute[]
  readonly findings: readonly FindingDraft[]
}

function underDirectory(file: string, directories: readonly string[]): string | undefined {
  return directories.find((directory) => file.startsWith(`${directory}/`))
}

/**
 * The URL a page file serves, and the parameters in it.
 *
 * A page is a `.vue` file under a pages directory, its directory path is its
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

/** The parameters a declared path names, in the order they appear. */
export function paramsOf(pattern: string): readonly string[] {
  return [...pattern.matchAll(/:([A-Za-z0-9_]+)/g)].map((match) => match[1] ?? '')
}

const QUOTED = /^(['"])(.*)\1$/s

function unquote(text: string): string {
  return text.slice(1, -1)
}

/**
 * The argument text of the `definePageMeta` macro, or nothing when a file does
 * not call it.
 *
 * The macro is read as text rather than compiled, so a value that is not a
 * literal is reported instead of guessed at.
 */
function macroArgument(text: string): string | undefined {
  const marker = 'definePageMeta('
  const start = text.indexOf(marker)

  if (start === -1) {
    return undefined
  }

  let depth = 0

  for (let index = start + marker.length - 1; index < text.length; index += 1) {
    const character = text.charAt(index)

    if (character === '(') {
      depth += 1
    } else if (character === ')') {
      depth -= 1

      if (depth === 0) {
        return text.slice(start + marker.length, index)
      }
    }
  }

  return undefined
}

/** The raw text of one property, ending at the next top level comma or brace. */
function propertyText(argument: string, at: number): string {
  let depth = 0
  let index = at

  while (index < argument.length) {
    const character = argument.charAt(index)

    if (character === '[' || character === '{' || character === '(') {
      depth += 1
    } else if (character === ']' || character === '}' || character === ')') {
      if (depth === 0) {
        break
      }

      depth -= 1
    } else if (character === ',' && depth === 0) {
      break
    }

    index += 1
  }

  return argument.slice(at, index).trim()
}

interface Read {
  readonly present: boolean
  readonly literal: boolean
  readonly values: readonly string[]
  readonly text: string
}

/** Reads one property, and says whether it was a literal the adapter can trust. */
function readProperty(argument: string, key: string): Read {
  const match = new RegExp(`(?:^|[,{\\s])${key}\\s*:`).exec(argument)

  if (match === null) {
    return { present: false, literal: true, values: [], text: '' }
  }

  const text = propertyText(argument, match.index + match[0].length)

  const single = QUOTED.exec(text)

  if (single !== null) {
    return { present: true, literal: true, values: [unquote(text)], text }
  }

  if (text.startsWith('[') && text.endsWith(']')) {
    const values: string[] = []

    for (const part of text.slice(1, -1).split(',')) {
      const element = part.trim()

      if (element === '') {
        continue
      }

      const quoted = QUOTED.exec(element)

      if (quoted === null) {
        return { present: true, literal: false, values: [], text }
      }

      values.push(unquote(element))
    }

    return { present: true, literal: true, values, text }
  }

  return { present: true, literal: false, values: [], text }
}

/**
 * What a page declares about itself.
 *
 * Only the literal values are read. A path that is a regular expression, a
 * middleware that is a function, or a layout whose name is computed are all
 * things this adapter cannot see, and it says so rather than inventing an answer.
 */
export function readPageMetadata(text: string): {
  readonly metadata: PageMetadata
  readonly unread: readonly string[]
} {
  const argument = macroArgument(text)

  if (argument === undefined) {
    return { metadata: { middleware: [], aliases: [] }, unread: [] }
  }

  const unread: string[] = []
  const path = readProperty(argument, 'path')
  const aliases = readProperty(argument, 'alias')
  const layout = readProperty(argument, 'layout')
  const middleware = readProperty(argument, 'middleware')
  const name = readProperty(argument, 'name')
  const key = readProperty(argument, 'key')

  for (const [label, read] of [
    ['path', path],
    ['alias', aliases],
    ['layout', layout],
    ['middleware', middleware],
    ['name', name],
    ['key', key],
  ] as const) {
    if (read.present && !read.literal) {
      unread.push(label)
    }
  }

  const layoutLiteral = layout.values[0]

  return {
    metadata: {
      ...(name.values[0] === undefined ? {} : { name: name.values[0] }),
      ...(key.values[0] === undefined ? {} : { key: key.values[0] }),
      ...(layout.present && layout.text === 'false'
        ? { layout: false }
        : layoutLiteral === undefined
          ? {}
          : { layout: layoutLiteral }),
      middleware: middleware.values,
      ...(path.values[0] === undefined ? {} : { path: path.values[0] }),
      aliases: aliases.values,
    },
    unread,
  }
}

interface Page {
  readonly file: string
  readonly pagesDir: string
  readonly metadata: PageMetadata
  readonly patterns: readonly { readonly pattern: string; readonly declared: boolean }[]
}

/**
 * The routes a project establishes, and what each page said about itself.
 *
 * A page can live in more than one root, because Nuxt 4 moved the application
 * under `app` while older projects keep it at the root or under `src`. When two
 * roots claim one URL the adapter keeps one route, chosen by the file path and
 * not by directory order, and names both files, because a project in that state
 * is a project that has not finished moving.
 */
export function readRoutes(
  files: readonly string[],
  readText: (file: string) => string | undefined,
): PageReading {
  const findings: FindingDraft[] = []
  const pages: Page[] = []

  for (const file of files) {
    const pagesDir = underDirectory(file, PAGES_DIRS)

    if (pagesDir === undefined || !file.endsWith('.vue')) {
      continue
    }

    // A server component is not a page: it renders somewhere the target is not.
    // A `.client.vue` page is a page, and it is still a route.
    if (file.endsWith(SERVER_COMPONENT_SUFFIX)) {
      continue
    }

    const text = readText(file) ?? ''
    const { metadata, unread } = readPageMetadata(text)

    if (unread.length > 0) {
      findings.push({
        code: 'nuxt-page-metadata-not-read',
        title: 'Page metadata that is not a literal',
        message: `This page declares ${unread.join(', ')} with a value that is not a literal, so the adapter read the file name and not the declaration.`,
        file,
      })
    }

    const patterns: { pattern: string; declared: boolean }[] = [
      {
        pattern: metadata.path ?? pagePattern(file, pagesDir).pattern,
        declared: metadata.path !== undefined,
      },
      ...metadata.aliases.map((alias) => ({ pattern: alias, declared: true })),
    ]

    pages.push({ file, pagesDir, metadata, patterns })
  }

  pages.sort((left, right) => left.file.localeCompare(right.file))

  const byPattern = new Map<string, Page[]>()
  const routes: DiscoveredRoute[] = []

  for (const page of pages) {
    for (const { pattern, declared } of page.patterns) {
      const claimants = byPattern.get(pattern) ?? []

      // The first file to claim a path keeps it, and the pages were sorted by
      // path before this loop, so the winner does not depend on the order the
      // directories happened to be read in. The files that lose are reported
      // below and contribute no route: two routes for one path would claim the
      // project serves both, which is exactly what the collision is about.
      if (claimants.length === 0) {
        const source: SourceLocation = { file: page.file, adapterId: ADAPTER_ID }
        const params = paramsOf(pattern)

        routes.push({
          key: pattern,
          pathPattern: pattern,
          ...(params.length === 0 ? {} : { params }),
          source,
        })
      }

      claimants.push(page)
      byPattern.set(pattern, claimants)

      if (claimants.length > 1) {
        findings.push({
          code: 'nuxt-page-path-collision',
          title: 'Two page files claim one path',
          message: `Among these files, ${pattern} is served by ${claimants[0]?.file ?? page.file}, which is the rule this adapter keeps regardless of directory order. The other files that claim it are ${claimants
            .slice(1)
            .map((claimant) => claimant.file)
            .join(', ')}.${declared ? ' One of them declared the path itself.' : ''}`,
          file: page.file,
        })
      }
    }
  }

  return {
    routes: routes.sort((left, right) => left.key.localeCompare(right.key)),
    pages: pages.map((page) => ({ file: page.file, metadata: page.metadata })),
    findings,
  }
}

function property(object: ts.ObjectLiteralExpression, name: string): ts.Expression | undefined {
  for (const candidate of object.properties) {
    if (
      ts.isPropertyAssignment(candidate) &&
      (ts.isIdentifier(candidate.name) || ts.isStringLiteralLike(candidate.name)) &&
      candidate.name.text === name
    ) {
      return candidate.initializer
    }
  }

  return undefined
}

function location(file: string, sourceFile: ts.SourceFile, node: ts.Node): SourceLocation {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))

  return {
    file,
    adapterId: ADAPTER_ID,
    start: { line: start.line + 1, column: start.character + 1 },
  }
}

function nestedPattern(parent: string, child: string): string {
  if (child === '') return parent
  if (child.startsWith('/')) return child
  return parent === '/' ? `/${child}` : `${parent}/${child}`
}

/** A literal route declaration uses the framework's path syntax unchanged. */
function routePattern(path: string): { readonly pattern: string } {
  return { pattern: path === '' ? '/' : path.startsWith('/') ? path : `/${path}` }
}

function localImports(
  file: string,
  sourceFile: ts.SourceFile,
  files: ReadonlySet<string>,
): ReadonlyMap<string, string> {
  const imports = new Map<string, string>()

  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !statement.moduleSpecifier.text.startsWith('.') ||
      statement.importClause?.namedBindings === undefined ||
      !ts.isNamedImports(statement.importClause.namedBindings)
    )
      continue

    const base = normalize(join(dirname(file), statement.moduleSpecifier.text))
    const resolved = [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      `${base}.js`,
      `${base}.mjs`,
      `${base}.cjs`,
    ].find((candidate) => files.has(candidate))
    if (resolved === undefined) continue

    for (const binding of statement.importClause.namedBindings.elements)
      imports.set(binding.name.text, resolved)
  }

  return imports
}

function routeFile(file: string, route: ts.ObjectLiteralExpression): string | undefined {
  const target = property(route, 'file')
  if (target === undefined || !ts.isCallExpression(target)) return undefined

  const relative = target.arguments.find((argument) => ts.isStringLiteralLike(argument))
  return relative === undefined ? undefined : normalize(join(dirname(file), relative.text))
}

function readRouteArray(
  file: string,
  sourceFile: ts.SourceFile,
  initializer: ts.Expression,
  parentPath?: string,
): ModuleRouteReading {
  if (!ts.isArrayLiteralExpression(initializer)) {
    return {
      routes: [],
      findings: [
        {
          code: 'nuxt-module-routes-not-literal',
          title: 'Module routes are not a literal array',
          message: `${file} exports module routes through an expression, so no paths were guessed.`,
          file,
        },
      ],
    }
  }

  const routes: DiscoveredRoute[] = []
  const findings: FindingDraft[] = []
  for (const entry of initializer.elements) {
    if (!ts.isObjectLiteralExpression(entry)) {
      findings.push({
        code: 'nuxt-module-route-not-literal',
        title: 'A module route is not a literal object',
        message: `${file} declares a module route through an expression or spread, so it was not guessed.`,
        file,
      })
      continue
    }

    const path = property(entry, 'path')
    if (path === undefined || !ts.isStringLiteralLike(path)) {
      findings.push({
        code: 'nuxt-module-route-path-not-literal',
        title: 'A module route path is not a literal',
        message: `${file} declares a computed module route path, so it was not guessed.`,
        file,
      })
      continue
    }

    const pathPattern =
      parentPath === undefined
        ? routePattern(path.text).pattern
        : nestedPattern(parentPath, path.text)
    const params = paramsOf(pathPattern)
    const unitFile = routeFile(file, entry)
    routes.push({
      key: `${pathPattern}:${entry.getStart(sourceFile)}`,
      pathPattern,
      ...(unitFile === undefined ? {} : { unitFile, unitKey: 'default' }),
      ...(params.length === 0 ? {} : { params }),
      source: location(file, sourceFile, entry),
    })

    const children = property(entry, 'children')
    if (children !== undefined) {
      const nested = readRouteArray(file, sourceFile, children, pathPattern)
      routes.push(...nested.routes)
      findings.push(...nested.findings)
    }
  }

  return { routes, findings }
}

function pushedRouteNames(sourceFile: ts.SourceFile): readonly string[] {
  const names = new Set<string>()
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'extendPages'
    ) {
      const callback = node.arguments[0]
      if (callback !== undefined) {
        const inspect = (candidate: ts.Node): void => {
          if (
            ts.isCallExpression(candidate) &&
            ts.isPropertyAccessExpression(candidate.expression) &&
            candidate.expression.name.text === 'push'
          ) {
            for (const argument of candidate.arguments) {
              if (ts.isSpreadElement(argument) && ts.isIdentifier(argument.expression))
                names.add(argument.expression.text)
            }
          }
          ts.forEachChild(candidate, inspect)
        }
        inspect(callback)
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return [...names].sort()
}

/**
 * Nuxt modules can extend the file-system router with literal arrays. Read the
 * small, auditable subset that is established by `extendPages(...push(...routes))`.
 * Computed tables and route mutations remain findings rather than guesses.
 */
export function readModuleRoutes(
  files: readonly string[],
  readText: (file: string) => string | undefined,
): ModuleRouteReading {
  const available = new Set(files)
  const routes: DiscoveredRoute[] = []
  const findings: FindingDraft[] = []

  for (const file of files
    .filter((candidate) => /(?:^|\/)module\.[cm]?[jt]s$/.test(candidate))
    .sort()) {
    const text = readText(file)
    if (text === undefined || !text.includes('extendPages')) continue
    const moduleSource = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
    const imports = localImports(file, moduleSource, available)

    for (const name of pushedRouteNames(moduleSource)) {
      const routeTableFile = imports.get(name)
      if (routeTableFile === undefined) {
        findings.push({
          code: 'nuxt-module-route-table-not-local',
          title: 'A module route table is not a local import',
          message: `${file} passes ${name} to extendPages, but the adapter cannot establish a local literal route table for it.`,
          file,
        })
        continue
      }
      const routeText = readText(routeTableFile)
      if (routeText === undefined) continue
      const routeSource = ts.createSourceFile(
        routeTableFile,
        routeText,
        ts.ScriptTarget.Latest,
        true,
      )
      const declaration = routeSource.statements
        .flatMap((statement) =>
          ts.isVariableStatement(statement) ? [...statement.declarationList.declarations] : [],
        )
        .find((candidate) => ts.isIdentifier(candidate.name) && candidate.name.text === name)
      if (declaration?.initializer === undefined) {
        findings.push({
          code: 'nuxt-module-route-table-not-found',
          title: 'A module route table was not found',
          message: `${file} imports ${name} from ${routeTableFile}, but that file does not declare a readable table with that name.`,
          file: routeTableFile,
        })
        continue
      }
      const reading = readRouteArray(routeTableFile, routeSource, declaration.initializer)
      routes.push(...reading.routes)
      findings.push(...reading.findings)
    }
  }

  return {
    routes: routes.sort((left, right) => left.key.localeCompare(right.key)),
    findings: findings.sort(
      (left, right) => left.code.localeCompare(right.code) || left.file.localeCompare(right.file),
    ),
  }
}

/**
 * Layouts as units.
 *
 * A layout is application code with a source location, and the graph has the kind
 * for it. Reporting it as a finding would have said the adapter could not read
 * it, which is false, and would have hidden the largest body of portable code in
 * a typical Nuxt project.
 *
 * Composables are application modules, and the neutral predicate the base adapter
 * applies already reports them. A rule here would report each of them twice under
 * two identifiers, which is the duplication composition exists to remove.
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
    }
  }

  return units.sort((left, right) => left.source.file.localeCompare(right.source.file))
}

/** The files this adapter read nothing from, so the user can see the edge. */
export function readUnmodelled(
  files: readonly string[],
): readonly { readonly code: string; readonly what: string; readonly file: string }[] {
  const found: { code: string; what: string; file: string }[] = []

  for (const file of files) {
    if (file.endsWith(SERVER_COMPONENT_SUFFIX)) {
      found.push({ code: 'nuxt-server-component', what: 'a server component', file })
      continue
    }

    const surface = SERVER_SURFACE.find((entry) => file.startsWith(`${entry.dir}/`))

    if (surface !== undefined) {
      found.push({ code: surface.code, what: surface.what, file })
      continue
    }

    if (CONFIG_FILES.includes(file)) {
      found.push({ code: 'nuxt-runtime-config', what: 'the runtime configuration', file })
      continue
    }

    if (APP_CONFIG_FILES.includes(file)) {
      found.push({ code: 'nuxt-app-config', what: 'the application configuration', file })
    }
  }

  return found.sort((left, right) => left.file.localeCompare(right.file))
}
