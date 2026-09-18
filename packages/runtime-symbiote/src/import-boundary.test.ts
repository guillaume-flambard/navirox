import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * The import boundary, as a test rather than a convention.
 *
 * Navirox's whole bet is that the renderer is replaceable. That only holds if
 * exactly one package knows the renderer's name. The moment a second package
 * imports `@symbiote-native/*`, swapping engines starts meaning rewriting the
 * toolchain, the router and the component surface, and the bet is lost quietly.
 *
 * This is a static scan on purpose: it needs no Symbiote install and it fails on
 * the commit that breaks the rule, not on the build that follows it.
 */

const packagesDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const ALLOWED_PACKAGE = 'runtime-symbiote'
const RENDERER_PACKAGES = ['@symbiote-native/', 'react-native', 'react']

interface IViolation {
  readonly file: string
  readonly line: string
}

/**
 * The module specifiers a source text imports.
 *
 * The rule is about imports, so the check reads imports. Matching on a quoted
 * substring was precise enough while the only reason to write a renderer name in a
 * neutral package was a mistake, and it stopped being precise the moment a data
 * file had to name `react-native` as the subject of a compatibility record rather
 * than as something to import. A check that forbids naming a thing is a different
 * check from one that forbids depending on it, and this is the second.
 */
function importSpecifiers(source: string): readonly string[] {
  const found = new Set<string>()

  for (const line of codeLines(source)) {
    for (const match of line.matchAll(
      /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"]([^'"]+)['"]/g,
    )) {
      const specifier = match[1]

      if (specifier !== undefined) {
        found.add(specifier)
      }
    }
  }

  return [...found]
}

function sourceFiles(dir: string): readonly string[] {
  const entries = readdirSync(dir, { recursive: true, withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((file) => {
      const parts = file.split(/[\\/]/)
      // node_modules and dist are not our source. TypeScript's own .d.ts, for one,
      // contains the literal "react-native" in an enum and would be read as a breach.
      return !parts.includes('node_modules') && !parts.includes('dist')
    })
}

/** Strips comments so a doc comment explaining the rule is not read as breaking it. */
function codeLines(source: string): readonly string[] {
  return source
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .filter((line) => !line.trimStart().startsWith('*') && !line.trimStart().startsWith('/*'))
}

describe('the renderer import boundary', () => {
  const files = sourceFiles(packagesDir)

  it('has packages to scan', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  it('lets only runtime-symbiote name the renderer', () => {
    const violations: IViolation[] = []

    for (const file of files) {
      const parts = relative(packagesDir, file).split(/[\\/]/)
      const packageName = parts[0]
      if (packageName === undefined || packageName === ALLOWED_PACKAGE) continue

      for (const specifier of importSpecifiers(readFileSync(file, 'utf8'))) {
        if (RENDERER_PACKAGES.some((needle) => specifier.startsWith(needle))) {
          violations.push({ file: relative(packagesDir, file), line: specifier })
        }
      }
    }

    expect(violations, JSON.stringify(violations, null, 2)).toEqual([])
  })

  it('keeps the renderer package itself free of Navirox-side renderer leaks', () => {
    // The reverse direction matters too: runtime-symbiote is the edge, so nothing
    // inside it should re-export a Symbiote name through the public barrel.
    const barrel = readFileSync(join(packagesDir, ALLOWED_PACKAGE, 'src', 'index.ts'), 'utf8')
    expect(barrel).not.toMatch(/export\s+\*.*@symbiote-native/)
    expect(barrel).not.toMatch(/from '@symbiote-native/)
  })
})
