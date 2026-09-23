import { describe, expect, it } from 'vitest'
import { customConfigReader } from '../fixtures/custom-config.js'
import { frameworkCollisionReader } from '../fixtures/framework-collision.js'
import { nxTurboReader } from '../fixtures/nx-turbo.js'
import { pnpmWorkspaceReader } from '../fixtures/pnpm-workspace.js'
import { singlePackageReader } from '../fixtures/single-package.js'
import { canAdvance, discoverRepository } from './index.js'

describe('classification', () => {
  it('marks a conventional single package eligible', () => {
    const manifest = discoverRepository(singlePackageReader())

    expect(manifest.classification).toBe('eligible')
    expect(manifest.deltas).toEqual([])
    expect(manifest.packageManager.value).toBe('pnpm')
    expect(manifest.packageManager.confidence).toBe('high')
    expect(manifest.frameworkCandidates.value.map((candidate) => candidate.framework)).toEqual([
      'vue',
    ])
  })

  it('marks a workspace without lockfile eligible-with-deltas and enumerates them', () => {
    const manifest = discoverRepository(pnpmWorkspaceReader())

    expect(manifest.classification).toBe('eligible-with-deltas')
    const ids = manifest.deltas.map((delta) => delta.id)
    expect(ids).toContain('missing-lockfile')
    expect(ids).toContain('unresolved-versions')
    expect(canAdvance(manifest)).toBe(false)
    expect(canAdvance(manifest, ids)).toBe(true)
  })

  it('asks for manual discovery when several applications share a monorepo', () => {
    const undecided = discoverRepository(nxTurboReader())

    expect(undecided.classification).toBe('manual-discovery-required')
    expect(undecided.application.value).toBeNull()
    expect(canAdvance(undecided)).toBe(false)

    const decided = discoverRepository(nxTurboReader(), { app: 'apps/web' })

    expect(decided.application.value).toBe('apps/web')
    expect(decided.classification).not.toBe('manual-discovery-required')
    expect(decided.topology.workspaceDeclarations.value.map((entry) => entry.kind)).toEqual(
      expect.arrayContaining(['nx', 'turborepo']),
    )
  })

  it('refuses a custom configuration no profile covers', () => {
    const manifest = discoverRepository(customConfigReader())

    expect(manifest.classification).toBe('refused')
    expect(manifest.escapeHatches.value.some((hatch) => hatch.kind === 'custom-build-driver')).toBe(
      true,
    )
    expect(
      manifest.diagnostics.some(
        (diagnostic) => diagnostic.code === 'unsupported-custom-configuration',
      ),
    ).toBe(true)
    expect(
      canAdvance(
        manifest,
        manifest.deltas.map((delta) => delta.id),
      ),
    ).toBe(false)
  })

  it('refuses a framework collision and records every candidate instead of choosing', () => {
    const manifest = discoverRepository(frameworkCollisionReader())

    expect(manifest.classification).toBe('refused')
    expect(manifest.frameworkCandidates.value.map((candidate) => candidate.framework)).toEqual([
      'angular',
      'vue',
    ])
    expect(
      manifest.diagnostics.some((diagnostic) => diagnostic.code === 'framework-collision'),
    ).toBe(true)
  })

  it('never lets a non eligible manifest advance', () => {
    const manifests = [
      discoverRepository(pnpmWorkspaceReader()),
      discoverRepository(nxTurboReader()),
      discoverRepository(customConfigReader()),
      discoverRepository(frameworkCollisionReader()),
    ]

    for (const manifest of manifests) {
      expect(manifest.classification).not.toBe('eligible')
      expect(canAdvance(manifest)).toBe(false)
    }
  })
})
