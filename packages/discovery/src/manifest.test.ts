import { describe, expect, it } from 'vitest'
import { singlePackageReader } from '../fixtures/single-package.js'
import {
  REPOSITORY_CAPABILITY_MANIFEST_SCHEMA_VERSION,
  canAdvance,
  discoverRepository,
  serializeManifest,
  snapshotHashOf,
} from './index.js'

describe('repository capability manifest', () => {
  it('states the schema version it speaks', () => {
    expect(REPOSITORY_CAPABILITY_MANIFEST_SCHEMA_VERSION).toBe(1)
  })

  it('produces a manifest with a schema version and a snapshot hash, and writes nothing', () => {
    const manifest = discoverRepository(singlePackageReader())

    expect(manifest.schemaVersion).toBe(1)
    expect(manifest.snapshotHash).toMatch(/^[0-9a-f]{64}$/)
    expect(Object.keys(manifest)).not.toContain('output')
    expect(Object.keys(manifest)).not.toContain('writes')
  })

  it('is deterministic: two runs over the same inputs agree on manifest and hash', () => {
    const first = discoverRepository(singlePackageReader())
    const second = discoverRepository(singlePackageReader())

    expect(second).toEqual(first)
    expect(second.snapshotHash).toBe(first.snapshotHash)
  })

  it('hashes the canonical form, so the hash verifies against the content', () => {
    const manifest = discoverRepository(singlePackageReader())

    expect(snapshotHashOf(manifest)).toBe(manifest.snapshotHash)
    expect(serializeManifest(manifest)).not.toContain(manifest.snapshotHash)
  })

  it('records the selected root and application', () => {
    const manifest = discoverRepository(singlePackageReader())

    expect(manifest.root).toBe('.')
    expect(manifest.application.value).toBe('.')
    expect(manifest.application.location.file).toBe('package.json')
  })

  it('lets only an eligible manifest advance without acceptance', () => {
    const manifest = discoverRepository(singlePackageReader())

    expect(manifest.classification).toBe('eligible')
    expect(canAdvance(manifest)).toBe(true)
  })
})
