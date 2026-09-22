/**
 * Requalification for the benchmark catalog.
 *
 * The catalog pins a commit for every benchmark project. That pin is evidence:
 * it says which revision the recorded numbers describe. This module asks each
 * repository for its current default-branch head and reports whether the pin is
 * still that head. It is read-only with respect to history: it writes one report
 * and nothing else, so a drift finding is a question for a person (retain the
 * pin, create a new pinned profile, or retire the claim) rather than an edit.
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

import { REPOSITORY_ROOT } from './proof-artifacts.mjs'

export const CATALOG_PATH = 'benchmarks/catalog.json'
export const REPORT_PATH = 'docs/evidence/requalification.json'

export const STATUS = {
  pinned: 'pinned',
  drift: 'drift',
  unresolved: 'unresolved',
}

export function readCatalog(root = REPOSITORY_ROOT) {
  return JSON.parse(readFileSync(join(root, CATALOG_PATH), 'utf8'))
}

export function resolveHead(repository) {
  try {
    const output = execFileSync('git', ['ls-remote', repository, 'HEAD'], {
      encoding: 'utf8',
      timeout: 30_000,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const line = output
      .split('\n')
      .map((entry) => entry.trim())
      .find((entry) => entry.length > 0)
    if (!line) {
      return { commit: null, error: 'the repository advertised no head' }
    }
    const [commit] = line.split(/\s+/)
    return { commit, error: null }
  } catch (error) {
    return { commit: null, error: error instanceof Error ? error.message : String(error) }
  }
}

export function requalify({ catalog, resolve = resolveHead, now = () => new Date() }) {
  const projects = (catalog.projects ?? []).map((project) => {
    const { commit, error } = resolve(project.repository)
    const status =
      commit === null ? STATUS.unresolved : commit === project.commit ? STATUS.pinned : STATUS.drift
    return {
      id: project.id,
      repository: project.repository,
      pinnedCommit: project.commit,
      currentHead: commit,
      status,
      error,
    }
  })

  return {
    generatedAt: now().toISOString(),
    reference: { catalog: CATALOG_PATH, version: catalog.version ?? null },
    projects,
  }
}

export function formatRequalification(report) {
  return report.projects
    .map((project) => {
      if (project.status === STATUS.pinned) {
        return `${project.id}: pinned commit is the current head`
      }
      if (project.status === STATUS.drift) {
        return `${project.id}: drift, pinned ${project.pinnedCommit} but head is ${project.currentHead}`
      }
      return `${project.id}: unresolved (${project.error ?? 'unknown error'})`
    })
    .join('\n')
}

export function writeRequalificationReport({ root = REPOSITORY_ROOT, resolve, now } = {}) {
  const catalog = readCatalog(root)
  const report = requalify({ catalog, resolve, now })
  const target = join(root, REPORT_PATH)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  return { report, path: REPORT_PATH }
}
