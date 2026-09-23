import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import {
  NEUTRAL_PACKAGE_DIRS,
  SOURCE_FRAMEWORK_PATTERNS,
  TARGET_PROVIDER_PATTERNS,
  forbiddenSpecifiers,
  importSpecifiers,
  isNeutralPackageDir,
  isSourceAdapterPackageDir,
  isTargetProviderPackageDir,
} from './index'

/**
 * The source seam boundary, as a test rather than a convention.
 *
 * The renderer boundary already proves that one static scan can hold a seam
 * closed. This is the same trick on the other side: framework knowledge is
 * allowed in a source adapter and nowhere else, so the neutral core cannot
 * quietly become a place where one framework's habits live.
 *
 * It is a scan of the TypeScript source rather than of a build, so it needs no
 * framework installed and it fails on the commit that crosses the line.
 */

const packagesDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

interface IViolation {
  readonly file: string
  readonly specifier: string
}

function sourceFiles(dir: string): readonly string[] {
  const files: string[] = []

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue

    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...sourceFiles(path))
    } else if (entry.name.endsWith('.ts')) {
      files.push(path)
    }
  }

  return files
}

function packageDirectories(): readonly string[] {
  return readdirSync(packagesDir)
    .filter((name) => statSync(join(packagesDir, name)).isDirectory())
    .sort((left, right) => left.localeCompare(right))
}

describe('the source framework import boundary', () => {
  it('has both forbidden lists declared', () => {
    expect(SOURCE_FRAMEWORK_PATTERNS.length).toBeGreaterThan(0)
    expect(TARGET_PROVIDER_PATTERNS.length).toBeGreaterThan(0)
    expect(NEUTRAL_PACKAGE_DIRS.length).toBeGreaterThan(0)
  })

  it('names only package directories that exist', () => {
    const known = packageDirectories()
    const missing = NEUTRAL_PACKAGE_DIRS.filter((name) => !known.includes(name))

    expect(missing, `Unknown neutral package directories: ${missing.join(', ')}`).toEqual([])
  })

  it('scans a real set of files', () => {
    const scanned = NEUTRAL_PACKAGE_DIRS.flatMap((name) =>
      sourceFiles(join(packagesDir, name, 'src')),
    )

    expect(scanned.length).toBeGreaterThan(5)
  })

  it('keeps framework imports out of the neutral packages', () => {
    const violations: IViolation[] = []

    for (const directory of packageDirectories()) {
      if (!isNeutralPackageDir(directory)) continue

      for (const file of sourceFiles(join(packagesDir, directory, 'src'))) {
        const crossed = forbiddenSpecifiers('neutral', importSpecifiers(readFileSync(file, 'utf8')))
        for (const specifier of crossed) {
          violations.push({ file: relative(packagesDir, file), specifier })
        }
      }
    }

    expect(violations, JSON.stringify(violations, null, 2)).toEqual([])
  })

  it('scans the adapter packages, including the Angular proof path', () => {
    const scanned = packageDirectories()
      .filter((name) => isSourceAdapterPackageDir(name))
      .flatMap((name) => sourceFiles(join(packagesDir, name, 'src')))

    expect(scanned.length).toBeGreaterThan(5)
    expect(scanned.some((file) => file.includes('source-angular'))).toBe(true)
  })

  it('keeps target provider imports out of the source adapters', () => {
    // The other half of the asymmetry. An adapter may name its framework, and
    // it may not reach for the target side: the Angular proof path is where
    // that matters most, because a companion is close enough to tempt one.
    const violations: IViolation[] = []

    for (const directory of packageDirectories()) {
      if (!isSourceAdapterPackageDir(directory)) continue

      for (const file of sourceFiles(join(packagesDir, directory, 'src'))) {
        const crossed = forbiddenSpecifiers('adapter', importSpecifiers(readFileSync(file, 'utf8')))
        for (const specifier of crossed) {
          violations.push({ file: relative(packagesDir, file), specifier })
        }
      }
    }

    expect(violations, JSON.stringify(violations, null, 2)).toEqual([])
  })

  it('keeps the source side out of the target providers', () => {
    // A target consumes the Workflow IR and emits native source. Naming the
    // compiler of the framework it targets is its job; reaching back into a
    // source adapter would weld shut the seam, because an adapter is the one
    // package allowed to know a source framework, and a target is not.
    const violations: IViolation[] = []

    for (const directory of packageDirectories()) {
      if (!isTargetProviderPackageDir(directory)) continue

      for (const file of sourceFiles(join(packagesDir, directory, 'src'))) {
        const crossed = forbiddenSpecifiers('target', importSpecifiers(readFileSync(file, 'utf8')))
        for (const specifier of crossed) {
          violations.push({ file: relative(packagesDir, file), specifier })
        }
      }
    }

    expect(violations, JSON.stringify(violations, null, 2)).toEqual([])
  })

  it('lets a target name its compiler but never a source adapter', () => {
    expect(forbiddenSpecifiers('target', ['@vue/compiler-dom'])).toEqual([])
    expect(forbiddenSpecifiers('target', ['@angular/compiler'])).toEqual([])

    expect(forbiddenSpecifiers('target', ['@memolabs-apps/source-vue'])).toEqual([
      '@memolabs-apps/source-vue',
    ])
    expect(forbiddenSpecifiers('target', ['@memolabs-apps/source'])).toEqual([
      '@memolabs-apps/source',
    ])
  })

  it('lets an adapter name its framework but never a target provider', () => {
    // The asymmetry is the seam. An adapter is where framework knowledge is
    // supposed to live, so naming one is not a violation there; reaching for the
    // target side is, because that is what makes an adapter stop being reusable.
    expect(forbiddenSpecifiers('neutral', ['vue'])).toEqual(['vue'])
    expect(forbiddenSpecifiers('neutral', ['@memolabs-apps/runtime'])).toEqual([])

    expect(forbiddenSpecifiers('adapter', ['vue'])).toEqual([])
    expect(forbiddenSpecifiers('adapter', ['@memolabs-apps/runtime'])).toEqual([
      '@memolabs-apps/runtime',
    ])
  })

  it('tells an adapter package apart from a neutral one', () => {
    expect(isSourceAdapterPackageDir('source-vue')).toBe(true)
    expect(isNeutralPackageDir('source-vue')).toBe(false)
    expect(isNeutralPackageDir('source')).toBe(true)
  })
})
