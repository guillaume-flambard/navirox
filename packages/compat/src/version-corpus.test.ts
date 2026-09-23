import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadSeedVersionMatrix } from './index'

/**
 * The corpus behind the matrix.
 *
 * A verified line without its three fixtures is a claim without a way to
 * check it, so the matrix and the corpus are tested together: for every
 * adapter the seed governs, a positive, a boundary and a refused fixture must
 * exist, each with its manifest, its pinned lockfile and its config snapshot.
 */

const packagesDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

const FIXTURE_FILES = ['package.json', 'pnpm-lock.yaml', 'tsconfig.json'] as const

function fixtureDir(adapterId: string, kind: string): string {
  return join(packagesDir, `source-${adapterId}`, 'fixtures', kind)
}

describe('the version corpus', () => {
  it('gives every governed adapter a positive, a boundary and a refused fixture', () => {
    const matrix = loadSeedVersionMatrix()

    expect(matrix.size).toBeGreaterThan(0)

    for (const row of matrix.list()) {
      for (const kind of ['version-positive', 'version-boundary', 'version-refused'] as const) {
        const dir = fixtureDir(row.adapterId, kind)

        for (const file of FIXTURE_FILES) {
          expect(
            existsSync(join(dir, file)),
            `${row.adapterId}:${row.profile} is missing ${kind}/${file}`,
          ).toBe(true)
        }
      }
    }
  })

  it('declares the governed framework in every fixture manifest', () => {
    const matrix = loadSeedVersionMatrix()

    for (const row of matrix.list()) {
      for (const kind of ['version-positive', 'version-boundary', 'version-refused'] as const) {
        const manifest = JSON.parse(
          readFileSync(join(fixtureDir(row.adapterId, kind), 'package.json'), 'utf8'),
        ) as { dependencies?: Record<string, string> }

        expect(
          manifest.dependencies?.[row.framework],
          `${row.adapterId} ${kind} declares no ${row.framework} range`,
        ).toBeTruthy()
      }
    }
  })

  it('pins a resolved version for the governed framework in every fixture lockfile', () => {
    const matrix = loadSeedVersionMatrix()

    for (const row of matrix.list()) {
      for (const kind of ['version-positive', 'version-boundary', 'version-refused'] as const) {
        const lockfile = readFileSync(
          join(fixtureDir(row.adapterId, kind), 'pnpm-lock.yaml'),
          'utf8',
        )

        expect(
          lockfile.includes(row.framework),
          `${row.adapterId} ${kind} pins no ${row.framework} resolution`,
        ).toBe(true)
        expect(lockfile).toMatch(/version: \d+\.\d+\.\d+/)
      }
    }
  })

  it('keeps a dedicated requalification fixture for the unverified Vue major', () => {
    const dir = join(packagesDir, 'source-vue', 'fixtures', 'version-requalification-vue4')

    for (const file of FIXTURE_FILES) {
      expect(existsSync(join(dir, file))).toBe(true)
    }

    const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
    }

    expect(manifest.dependencies?.['vue']).toBe('^4.0.0')
  })
})
