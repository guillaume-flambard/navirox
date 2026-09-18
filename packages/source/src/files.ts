/**
 * Which files in a project are worth reading.
 *
 * This lives in the neutral package rather than in an adapter or in the loader,
 * because both need the same answer and two answers would drift: a loader that
 * hands an adapter a file list the adapter then re-filters is a place for the two
 * to disagree about what a project is.
 */

/**
 * Directory names that never hold project source.
 *
 * The list is deliberately short and explicit. A dependency directory or a build
 * output directory is a fact about every JavaScript project, while anything more
 * specific belongs to an adapter that knows its own framework's output.
 */
export const IGNORED_DIRECTORIES: readonly string[] = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.turbo',
  '.output',
  '.nuxt',
  'vendor',
  'Pods',
]

/** True when any path segment is an ignored directory. */
export function isIgnoredPath(path: string): boolean {
  return path.split('/').some((segment) => IGNORED_DIRECTORIES.includes(segment))
}

/**
 * Extensions an adapter reads as source.
 *
 * Component extensions are included because a component is source: `.vue` was
 * added by the first adapter and `.svelte` by the second, and the list is data
 * so a third framework adds a value rather than a branch.
 */
export const SOURCE_EXTENSIONS: readonly string[] = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.vue',
  '.svelte',
]

/** True when the path has a source extension. */
export function isSourceFile(path: string): boolean {
  return SOURCE_EXTENSIONS.some((extension) => path.endsWith(extension))
}

/** Extensions that carry application behaviour, as opposed to a component format. */
export const APPLICATION_EXTENSIONS: readonly string[] = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
]

/** A file whose name marks it as a test rather than as shipped logic. */
export const TEST_FILE_PATTERN = /\.(test|spec)\.[cm]?[jt]sx?$/

/** Directories that hold tests rather than application code. */
export const TEST_DIRECTORIES: readonly string[] = [
  '__tests__',
  'test',
  'tests',
  'e2e',
  'spec',
  'specs',
  'cypress',
]

/** A file whose name marks it as configuration for a tool. */
export const CONFIG_FILE_PATTERN = /\.config\.[cm]?[jt]s$/

/**
 * Configuration files that do not follow the pattern.
 *
 * Declared rather than guessed, because "this is configuration" is a fact about a
 * name and every framework invents one.
 */
export const CONFIG_FILE_NAMES: readonly string[] = [
  'babel.config.js',
  'detox.config.js',
  'eslint.config.js',
  'eslint.config.mjs',
  'jest.config.js',
  'metro.config.js',
  'nuxt.config.js',
  'nuxt.config.ts',
  'postcss.config.js',
  'svelte.config.js',
  'tailwind.config.js',
  'vite.config.js',
  'vite.config.ts',
  'vitest.config.js',
  'vitest.config.ts',
  'vue.config.js',
]

/**
 * Base names that wire an application rather than being part of it.
 *
 * Excluded wherever they appear rather than only at the project root: a barrel
 * re-exports and an entry point wires, and a rule whose meaning depended on the
 * file's depth would be a rule nobody could explain later.
 */
export const ENTRY_FILE_NAMES: readonly string[] = ['index', 'main']

/**
 * Whether a file is application logic.
 *
 * This is the same question in every framework, so it is asked in one place: two
 * adapters with two copies of the rule would eventually disagree about the same
 * file, and the disagreement would look like a framework difference.
 *
 * A test file, a configuration file, an entry point and a declaration file are not
 * application logic, and each exclusion is a statement rather than a preference: a
 * test is not shipped, configuration describes the build, an entry point wires, and
 * a declaration file has no behaviour.
 */
export function isApplicationModule(path: string): boolean {
  if (isIgnoredPath(path) || path.endsWith('.d.ts')) {
    return false
  }

  const segments = path.split('/')
  const basename = segments.at(-1) ?? path

  if (segments.some((segment) => TEST_DIRECTORIES.includes(segment))) {
    return false
  }

  if (!APPLICATION_EXTENSIONS.some((extension) => basename.endsWith(extension))) {
    return false
  }

  if (TEST_FILE_PATTERN.test(basename) || CONFIG_FILE_PATTERN.test(basename)) {
    return false
  }

  if (CONFIG_FILE_NAMES.includes(basename)) {
    return false
  }

  return !ENTRY_FILE_NAMES.includes(basename.replace(/\.[^.]+$/, ''))
}
