import { posix } from 'node:path'

/**
 * The import specifiers a file names.
 *
 * A read, never a parse. The engine stays framework neutral, so it looks for the
 * module forms a project actually writes and prefers to report a specifier it
 * cannot place over resolving one by guesswork.
 */

const SPECIFIER_PATTERNS: readonly RegExp[] = [
  /\bfrom\s*['"]([^'"\n]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"\n]+)['"]\s*\)/g,
  /(?:^|[\n;])\s*import\s+['"]([^'"\n]+)['"]/g,
  /\brequire\s*\(\s*['"]([^'"\n]+)['"]\s*\)/g,
]

export function importSpecifiers(content: string): readonly string[] {
  const found = new Set<string>()

  for (const pattern of SPECIFIER_PATTERNS) {
    for (const match of content.matchAll(pattern)) {
      const specifier = match[1]

      if (specifier !== undefined && specifier.length > 0) {
        found.add(specifier)
      }
    }
  }

  return [...found].sort()
}

/** The extensions a relative specifier is allowed to leave out. */
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue', '.json'] as const

export function isRelativeSpecifier(specifier: string): boolean {
  return specifier.startsWith('.')
}

/**
 * Resolves a relative specifier against the directory of the file that names it.
 * The caller decides what exists, which keeps the engine away from the filesystem
 * and keeps a dry run a dry run.
 */
export function resolveRelativeSpecifier(
  fromFile: string,
  specifier: string,
  exists: (path: string) => boolean,
): string | undefined {
  const base = posix.normalize(posix.join(posix.dirname(fromFile), specifier))
  const candidates = [
    base,
    ...EXTENSIONS.map((extension) => `${base}${extension}`),
    ...EXTENSIONS.map((extension) => posix.join(base, `index${extension}`)),
  ]

  return candidates.find((candidate) => exists(candidate))
}

/** The package a bare specifier belongs to, scoped or not. */
export function packageNameOf(specifier: string): string {
  const parts = specifier.split('/')

  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : (parts[0] ?? specifier)
}
