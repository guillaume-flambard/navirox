import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { isIgnoredPath } from './files.js'

/**
 * A project as files, which is what a detection or inspection context needs.
 *
 * It lives here rather than in the tooling that calls an adapter, because both
 * the tooling and an adapter's own fixtures need the same walk, and two walks
 * would be two answers to "what is in this project".
 *
 * The order is sorted and the paths are relative with forward slashes, so an
 * inspection does not depend on the order a filesystem happened to return.
 */
export interface ProjectFiles {
  readonly rootDir: string
  /** Paths relative to `rootDir`, normalized to forward slashes, sorted. */
  readonly files: readonly string[]
  /** Reads a project file, or returns undefined when it cannot be read. */
  readonly readText: (path: string) => string | undefined
}

function walk(rootDir: string, directory = ''): string[] {
  const found: string[] = []
  const entries = readdirSync(join(rootDir, directory), { withFileTypes: true })

  for (const entry of entries) {
    const path = directory === '' ? entry.name : `${directory}/${entry.name}`

    if (entry.isDirectory()) {
      if (!isIgnoredPath(path)) {
        found.push(...walk(rootDir, path))
      }

      continue
    }

    if (entry.isFile() && !isIgnoredPath(path)) {
      found.push(path)
    }
  }

  return found
}

export function createProjectFiles(rootDir: string): ProjectFiles {
  const files = walk(rootDir).sort()

  return {
    rootDir,
    files,
    readText: (path: string): string | undefined => {
      if (isIgnoredPath(path)) {
        return undefined
      }

      try {
        return readFileSync(join(rootDir, path), 'utf8')
      } catch {
        return undefined
      }
    },
  }
}
