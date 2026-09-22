import { describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import {
  BENCHMARKS,
  INDEX_DOCUMENT,
  JOURNEYS,
  RELEASE_STATUS,
  checkProofIndex,
  formatFindings,
} from '../../../scripts/lib/proof-index.mjs'
import { REPOSITORY_ROOT } from '../../../scripts/lib/proof-artifacts.mjs'

const CATALOG = {
  version: 1,
  projects: [
    {
      id: 'baserow',
      repository: 'https://github.com/baserow/baserow.git',
      commit: '81e094a1f4b3a62625c218d78fe319ba44098617',
    },
  ],
}

function withRoot(files: Record<string, string>, run: (root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), 'navirox-proof-index-'))
  try {
    for (const [path, contents] of Object.entries(files)) {
      mkdirSync(dirname(join(root, path)), { recursive: true })
      writeFileSync(join(root, path), contents)
    }
    return run(root)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

function classesOf(findings: { artifactClass: string; path: string }[]) {
  return findings.map((finding) => [finding.artifactClass, finding.path])
}

describe('proof index', () => {
  it('fails a row that cites an artifact which does not exist', () => {
    withRoot({ [INDEX_DOCUMENT]: '# Proof index\n' }, (root) => {
      const findings = checkProofIndex({ root, catalog: CATALOG })
      const missing = findings.filter((finding) => finding.artifactClass === 'missing-artifact')
      expect(missing.length).toBeGreaterThan(0)
      expect(missing.map((finding) => finding.path)).toContain(JOURNEYS[0].artifacts[0])
    })
  })

  it('fails a benchmark project that has no row in the index', () => {
    withRoot({ [INDEX_DOCUMENT]: '# Proof index\n' }, (root) => {
      const findings = checkProofIndex({ root, benchmarks: [], catalog: CATALOG })
      expect(classesOf(findings)).toContainEqual(['benchmark-without-row', 'baserow'])
    })
  })

  it('fails a status word outside the declared vocabulary', () => {
    withRoot({ [INDEX_DOCUMENT]: '# Proof index\n' }, (root) => {
      const seeded = [{ ...JOURNEYS[0], status: 'probably' }]
      const findings = checkProofIndex({ root, journeys: seeded, benchmarks: [], catalog: CATALOG })
      expect(classesOf(findings)).toContainEqual(['unknown-status', JOURNEYS[0].id])
    })
  })

  it('names the class and the rule without echoing a value', () => {
    withRoot({ [INDEX_DOCUMENT]: '# Proof index\n' }, (root) => {
      const seeded = [{ ...JOURNEYS[0], status: 'probably' }]
      const report = formatFindings(
        checkProofIndex({ root, journeys: seeded, benchmarks: [], catalog: CATALOG }),
      ).join('\n')
      expect(report).toContain('unknown-status')
      expect(report).toContain('(probably)')
    })
  })

  it('passes on the committed index', () => {
    expect(checkProofIndex()).toEqual([])
  })

  it('declares a row with artifacts and a status from the vocabulary', () => {
    for (const entry of [...JOURNEYS, ...BENCHMARKS]) {
      expect(RELEASE_STATUS).toContain(entry.status)
      expect(entry.artifacts.length).toBeGreaterThan(0)
    }
  })

  it('names every declared artifact and journey in the document', () => {
    const document = readFileSync(join(REPOSITORY_ROOT, INDEX_DOCUMENT), 'utf8')
    for (const entry of [...JOURNEYS, ...BENCHMARKS]) {
      for (const artifact of entry.artifacts) {
        expect(document).toContain(artifact)
      }
    }
    for (const journey of JOURNEYS) {
      expect(document).toContain(journey.name)
    }
  })
})
