import type { DiscoveryReader } from './types.js'

/**
 * Builds an in memory reader from a file map. Tests and fixtures use it to
 * feed discovery exact inputs; production callers wrap their own bounded file
 * list the same way.
 */
export function createMemoryReader(
  files: Record<string, string>,
  symlinks?: readonly string[],
): DiscoveryReader {
  const entries = new Map(Object.entries(files))
  const links = symlinks === undefined ? undefined : [...symlinks]
  return {
    files: [...entries.keys()].sort((left, right) => left.localeCompare(right)),
    readText: (path: string) => entries.get(path),
    ...(links === undefined ? {} : { symlinks: links }),
  }
}
