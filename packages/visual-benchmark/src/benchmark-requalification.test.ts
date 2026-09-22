import { describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import {
  CATALOG_PATH,
  REPORT_PATH,
  formatRequalification,
  readCatalog,
  requalify,
  writeRequalificationReport,
} from '../../../scripts/lib/requalification.mjs'
import { REPOSITORY_ROOT } from '../../../scripts/lib/proof-artifacts.mjs'

const CLOCK = () => new Date('2026-09-22T00:00:00.000Z')

describe('benchmark requalification', () => {
  it('pins a repository and a commit for every benchmark project', () => {
    const catalog = readCatalog(REPOSITORY_ROOT)

    expect(catalog.projects.length).toBeGreaterThan(0)
    for (const project of catalog.projects) {
      expect(project.id).toBeTruthy()
      expect(project.repository).toMatch(/^https:\/\//)
      expect(project.commit).toMatch(/^[0-9a-f]{40}$/)
    }
  })

  it('separates a pin that still holds from drift and from an unreadable head', () => {
    const catalog = readCatalog(REPOSITORY_ROOT)
    const [first, second, third] = catalog.projects
    const heads = {
      [first.repository]: { commit: first.commit, error: null },
      [second.repository]: { commit: '0'.repeat(40), error: null },
      [third.repository]: { commit: null, error: 'the repository advertised no head' },
    }

    const report = requalify({
      catalog,
      resolve: (repository) => heads[repository],
      now: CLOCK,
    })

    expect(report.generatedAt).toBe('2026-09-22T00:00:00.000Z')
    expect(report.reference).toEqual({ catalog: CATALOG_PATH, version: catalog.version })
    expect(report.projects.map((project) => project.status)).toEqual([
      'pinned',
      'drift',
      'unresolved',
    ])
    expect(report.projects[0].pinnedCommit).toBe(first.commit)
    expect(report.projects[1].currentHead).toBe('0'.repeat(40))
    expect(report.projects[2].error).toBe('the repository advertised no head')
  })

  it('names the project and the reason in the human-readable summary', () => {
    const catalog = readCatalog(REPOSITORY_ROOT)
    const [first, second, third] = catalog.projects
    const report = requalify({
      catalog,
      resolve: (repository) =>
        repository === first.repository
          ? { commit: first.commit, error: null }
          : repository === second.repository
            ? { commit: '1'.repeat(40), error: null }
            : { commit: null, error: 'offline' },
      now: CLOCK,
    })

    const lines = formatRequalification(report).split('\n')

    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe(`${first.id}: pinned commit is the current head`)
    expect(lines[1]).toBe(
      `${second.id}: drift, pinned ${second.commit} but head is ${'1'.repeat(40)}`,
    )
    expect(lines[2]).toBe(`${third.id}: unresolved (offline)`)
  })

  it('writes its report without touching the catalog or a historical report', () => {
    const root = mkdtempSync(join(tmpdir(), 'navirox-requalification-'))
    try {
      const catalog = readCatalog(REPOSITORY_ROOT)
      const catalogFile = join(root, CATALOG_PATH)
      const historyFile = join(root, 'docs/evidence/historical.json')
      mkdirSync(dirname(catalogFile), { recursive: true })
      mkdirSync(dirname(historyFile), { recursive: true })
      writeFileSync(catalogFile, `${JSON.stringify(catalog, null, 2)}\n`)
      writeFileSync(historyFile, '{"verdict":"supported"}\n')
      const catalogBefore = readFileSync(catalogFile, 'utf8')
      const historyBefore = readFileSync(historyFile, 'utf8')

      const { path } = writeRequalificationReport({
        root,
        resolve: (repository) => ({ commit: repository, error: null }),
        now: CLOCK,
      })

      expect(path).toBe(REPORT_PATH)
      expect(readFileSync(catalogFile, 'utf8')).toBe(catalogBefore)
      expect(readFileSync(historyFile, 'utf8')).toBe(historyBefore)
      expect(existsSync(join(root, REPORT_PATH))).toBe(true)
      expect(existsSync(join(root, 'docs/evidence/requalification.json'))).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
