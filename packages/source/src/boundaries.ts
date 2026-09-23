/**
 * The source seam's forbidden lists, declared once.
 *
 * The renderer boundary works because exactly one package may name the renderer
 * and a test fails on the commit that breaks it. This is the same idea for the
 * other seam, and it has the same failure mode to avoid: a rule spread across
 * several files is a rule that gets broken quietly.
 *
 * Adding a framework is therefore a data change here, not an edit to a check.
 *
 * The patterns are regular expressions on purpose rather than plain strings. The
 * renderer boundary test scans every package outside `runtime-symbiote` for
 * import lines containing a quoted renderer name, and this file lives in one of
 * those packages. A list of plain names would trip that scan; a pattern anchored
 * on the start of a specifier does not.
 */

/** Framework and meta-framework packages the neutral core may never import. */
export const SOURCE_FRAMEWORK_PATTERNS: readonly RegExp[] = [
  /^vue(\/|$)/,
  /^@vue\//,
  /^nuxt(\/|$)/,
  /^@nuxt\//,
  /^@nuxtjs\//,
  /^svelte(\/|$)/,
  /^@sveltejs\//,
  /^@angular\//,
  /^react(\/|$)/,
  /^react-dom(\/|$)/,
  /^next(\/|$)/,
  /^react-router(\/|$)/,
  /^@remix-run\//,
  /^astro(\/|$)/,
  /^solid-js(\/|$)/,
  /^@builder\.io\/qwik/,
  /^lit(\/|$)/,
]

/**
 * Target-side packages a source adapter may never import.
 *
 * A source adapter describes the web application it was given. A target provider
 * decides what that application becomes on a phone. They meet at the graph, and
 * an adapter that reaches for the runtime has started choosing a target, which
 * is exactly what the seam exists to prevent.
 */
export const TARGET_PROVIDER_PATTERNS: readonly RegExp[] = [
  /^@memolabs-apps\/runtime(\/|$)/,
  /^@memolabs-apps\/runtime-symbiote(\/|$)/,
  /^@memolabs-apps\/ui(\/|$)/,
  /^@memolabs-apps\/native(\/|$)/,
  /^@memolabs-apps\/router(\/|$)/,
]

/**
 * The source-side packages a target provider may never reach for.
 *
 * A target consumes the Workflow IR and emits native source. Reaching back into a
 * source adapter would weld the two seams this layout exists to keep apart. A
 * target MAY import the compiler of the framework it targets, because compiling
 * that syntax is its job.
 */
export const SOURCE_PROVIDER_PATTERNS: readonly RegExp[] = [
  /^@memolabs-apps\/source(\/|$)/,
  /^@memolabs-apps\/source-/,
]

/**
 * Package directories whose code must stay framework-neutral.
 *
 * `runtime`, `ui`, `native` and `router` are absent on purpose: they are the
 * target side and `runtime` reads a source framework's types today. That is a
 * known, accepted state, and widening this list before those packages are
 * cleaned would produce a check that has to be ignored to stay green.
 */
export const NEUTRAL_PACKAGE_DIRS: readonly string[] = [
  'graph',
  'source',
  'compat',
  'inspect',
  'migrate',
  'config',
  'build',
  'doctor',
  'cli',
  'discovery',
  'workflow',
]

/** Adapters are the one place a source framework name is allowed to appear. */
export const ADAPTER_PACKAGE_PREFIX = 'source-'

/** Targets are the one place the framework a target compiles is allowed to appear. */
export const TARGET_PACKAGE_PREFIX = 'target-'

export function isNeutralPackageDir(directory: string): boolean {
  return NEUTRAL_PACKAGE_DIRS.includes(directory)
}

export function isSourceAdapterPackageDir(directory: string): boolean {
  return directory.startsWith(ADAPTER_PACKAGE_PREFIX)
}

export function isTargetProviderPackageDir(directory: string): boolean {
  return directory.startsWith(TARGET_PACKAGE_PREFIX)
}

export function matchesPattern(patterns: readonly RegExp[], specifier: string): boolean {
  return patterns.some((pattern) => pattern.test(specifier))
}

/**
 * The import specifiers a source file references.
 *
 * Comments are stripped first so a doc comment that explains the rule is not
 * read as breaking it, which is the same precaution the renderer boundary takes.
 */
export function importSpecifiers(source: string): readonly string[] {
  const withoutComments = source
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .filter((line) => !line.trimStart().startsWith('*') && !line.trimStart().startsWith('/*'))
    .join('\n')

  const specifiers = new Set<string>()
  const pattern = /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"]([^'"]+)['"]/g
  for (const match of withoutComments.matchAll(pattern)) {
    const specifier = match[1]
    if (specifier !== undefined) specifiers.add(specifier)
  }

  return [...specifiers].sort((left, right) => left.localeCompare(right))
}

/**
 * Which of these specifiers cross a line, given the package asking.
 *
 * One function rather than two so the asymmetry is visible: a neutral package
 * may not name a framework, and an adapter may, but an adapter may still not
 * name a target.
 */
export function forbiddenSpecifiers(
  kind: 'neutral' | 'adapter' | 'target',
  specifiers: readonly string[],
): readonly string[] {
  const patterns =
    kind === 'neutral'
      ? SOURCE_FRAMEWORK_PATTERNS
      : kind === 'adapter'
        ? TARGET_PROVIDER_PATTERNS
        : SOURCE_PROVIDER_PATTERNS

  return specifiers.filter((specifier) => matchesPattern(patterns, specifier))
}
