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
