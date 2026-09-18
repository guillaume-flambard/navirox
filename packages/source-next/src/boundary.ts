/**
 * The module boundary the framework makes explicit.
 *
 * In the App Router the directive at the top of a file says which runtime the
 * module runs in, and in its absence the module is a server component. That is a
 * fact about a file, read from a directive the framework defines, so it is
 * recorded as adapter owned metadata rather than turned into a shared concept or
 * reported as a finding per file.
 *
 * A finding per file was the alternative and it was rejected: almost every
 * interactive component declares the directive, so a finding each would bury the
 * findings that say something is missing. Metadata travels with the unit it
 * describes, which is where a reader will look for it.
 */

export const DIRECTIVE_PATTERN = /^\s*['"]use (client|server)['"]\s*;?/m

/** The boundary a source text declares, or undefined when it declares none. */
export function declaredBoundary(text: string): 'client' | 'server' | undefined {
  const match = DIRECTIVE_PATTERN.exec(text)

  return match?.[1] as 'client' | 'server' | undefined
}

/** True when the file is inside an App Router directory. */
export function isAppRouterFile(file: string): boolean {
  return file.startsWith('app/') || file.startsWith('src/app/')
}
