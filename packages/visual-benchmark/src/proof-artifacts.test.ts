import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  MANIFEST,
  MANIFEST_DOCUMENT,
  REPOSITORY_ROOT,
  formatFindings,
  scanProofPaths,
} from '../../../scripts/lib/proof-artifacts.mjs'

const CLOUD_KEY = 'AKIAIOSFODNN7EXAMPLE'
const JWT =
  'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'
const SEEDED = 'docs/evidence/seeded-capture.json'

function scanSeeded(contents: string) {
  const root = mkdtempSync(join(tmpdir(), 'proof-artifacts-'))
  const absolute = join(root, SEEDED)
  mkdirSync(dirname(absolute), { recursive: true })
  writeFileSync(absolute, contents)
  try {
    return scanProofPaths({ root, manifest: [{ path: SEEDED }], files: [SEEDED] })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

function classesOf(findings: { artifactClass: string; rule: string }[]) {
  return findings.map((finding) => [finding.artifactClass, finding.rule])
}

describe('proof artifact hygiene', () => {
  it('fails a declared artifact that carries a cloud access key', () => {
    const findings = scanSeeded(JSON.stringify({ accessKey: CLOUD_KEY }))
    expect(classesOf(findings)).toEqual([['credential-shaped-value', 'cloud-access-key']])
  })

  it('fails a declared artifact that carries a token shape', () => {
    const findings = scanSeeded(JSON.stringify({ session: JWT }))
    expect(classesOf(findings)).toEqual([['credential-shaped-value', 'jwt-shape']])
  })

  it('fails a declared artifact that assigns a secret-like value', () => {
    const findings = scanSeeded('api_key = "0123456789abcdef"\n')
    expect(classesOf(findings)).toEqual([['credential-shaped-value', 'secret-assignment']])
  })

  it('names the artifact class and the rule without echoing the value', () => {
    const report = formatFindings(scanSeeded(JSON.stringify({ accessKey: CLOUD_KEY }))).join('\n')
    expect(report).toContain('credential-shaped-value')
    expect(report).toContain('cloud-access-key')
    expect(report).not.toContain('AKIA')
    expect(report).not.toContain(CLOUD_KEY)
  })

  it('fails an undeclared asset in a fixture tree', () => {
    const findings = scanProofPaths({
      manifest: [],
      files: ['packages/target-vue/fixtures/field-workflow/borrowed-logo.svg'],
    })
    expect(classesOf(findings)).toEqual([['undeclared-asset', 'not-in-manifest']])
  })

  it('fails a record-bearing data file in a fixture tree', () => {
    const findings = scanProofPaths({
      manifest: [],
      files: ['packages/source-angular/fixtures/suitecrm-app/leads.csv'],
    })
    expect(classesOf(findings)).toEqual([['unapproved-fixture', 'not-in-manifest']])
  })

  it('passes the declared artifacts', () => {
    const findings = scanProofPaths({ files: MANIFEST.map((entry) => entry.path) })
    expect(findings).toEqual([])
  })

  it('describes every manifest entry with the declared fields', () => {
    for (const entry of MANIFEST) {
      expect(entry.path.length).toBeGreaterThan(0)
      expect(entry.provenance.length).toBeGreaterThan(0)
      expect(['evidence', 'report', 'fixture', 'asset', 'capture']).toContain(entry.purpose)
      expect(['synthetic', 'original-asset', 'measurement', 'source-derived', 'none']).toContain(
        entry.dataClass,
      )
    }
  })

  it('declares every manifest path in the document', () => {
    const document = readFileSync(join(REPOSITORY_ROOT, MANIFEST_DOCUMENT), 'utf8')
    for (const entry of MANIFEST) {
      expect(document).toContain(entry.path)
    }
  })
})
