import { emptyGraphFragment } from '@navirox/graph'
import { describe, expect, it } from 'vitest'

import {
  DuplicateAdapterError,
  SourceAdapterRegistry,
  UnknownAdapterError,
  selectAdapter,
} from './index'
import type { DetectionContext, DetectedSource, SourceAdapter, SourceInspection } from './index'

const CONTEXT: DetectionContext = {
  rootDir: '.',
  files: ['package.json'],
  readText: () => undefined,
}

interface ITestAdapterOptions {
  readonly id: string
  readonly confidence: 'low' | 'medium' | 'high'
  readonly composes?: readonly string[]
}

function testAdapter(options: ITestAdapterOptions): SourceAdapter {
  const { id, confidence } = options
  const inspection: SourceInspection = {
    descriptor: { adapterId: id, displayName: id },
    findings: [],
  }

  return {
    id,
    displayName: id,
    supportLevel: 'experimental',
    ...(options.composes === undefined ? {} : { composes: options.composes }),
    testedVersions: [{ framework: id, versions: ['1.0.0'] }],
    detect: async () => ({
      candidates: [{ confidence, evidence: [{ kind: 'manifest', value: 'package.json' }] }],
    }),
    inspect: async () => inspection,
    buildGraph: async () => emptyGraphFragment(),
  }
}

describe('SourceAdapterRegistry', () => {
  it('lists adapters in id order, not registration order', () => {
    const registry = new SourceAdapterRegistry()
    registry.register(testAdapter({ id: 'zeta', confidence: 'low' }))
    registry.register(testAdapter({ id: 'alpha', confidence: 'low' }))

    expect(registry.list().map((adapter) => adapter.id)).toEqual(['alpha', 'zeta'])

    const reversed = new SourceAdapterRegistry()
    reversed.register(testAdapter({ id: 'alpha', confidence: 'low' }))
    reversed.register(testAdapter({ id: 'zeta', confidence: 'low' }))

    expect(reversed.list().map((adapter) => adapter.id)).toEqual(
      registry.list().map((adapter) => adapter.id),
    )
  })

  it('refuses a second adapter under one id', () => {
    const registry = new SourceAdapterRegistry()
    registry.register(testAdapter({ id: 'vue', confidence: 'high' }))

    expect(() => registry.register(testAdapter({ id: 'vue', confidence: 'low' }))).toThrow(
      DuplicateAdapterError,
    )
  })

  it('fails in a typed way when an id was never registered', () => {
    const registry = new SourceAdapterRegistry()

    expect(() => registry.get('missing')).toThrow(UnknownAdapterError)
    expect(registry.has('missing')).toBe(false)
  })

  it('attributes each candidate to the adapter that reported it', async () => {
    const registry = new SourceAdapterRegistry()
    registry.register(testAdapter({ id: 'vue', confidence: 'high' }))
    registry.register(testAdapter({ id: 'nuxt', confidence: 'high', composes: ['vue'] }))

    const detected = await registry.detect(CONTEXT)

    expect(detected.map((source) => source.adapterId)).toEqual(['nuxt', 'vue'])
  })

  it('returns nothing when no adapter recognizes the project', async () => {
    const registry = new SourceAdapterRegistry()
    registry.register({
      ...testAdapter({ id: 'vue', confidence: 'high' }),
      detect: async () => ({ candidates: [] }),
    })

    expect(await registry.detect(CONTEXT)).toEqual([])
    expect(await registry.select(CONTEXT)).toBeUndefined()
  })

  it('prefers the adapter that composes the other', async () => {
    const registry = new SourceAdapterRegistry()
    registry.register(testAdapter({ id: 'vue', confidence: 'high' }))
    registry.register(testAdapter({ id: 'nuxt', confidence: 'low', composes: ['vue'] }))

    const chosen = await registry.select(CONTEXT)

    expect(chosen?.adapterId).toBe('nuxt')
  })

  it('breaks a tie by adapter id rather than by iteration order', async () => {
    const registry = new SourceAdapterRegistry()
    registry.register(testAdapter({ id: 'zeta', confidence: 'high' }))
    registry.register(testAdapter({ id: 'alpha', confidence: 'high' }))

    expect((await registry.select(CONTEXT))?.adapterId).toBe('alpha')
  })
})

describe('selectAdapter', () => {
  const lookup = (id: string): SourceAdapter | undefined =>
    id === 'vue' ? testAdapter({ id: 'vue', confidence: 'high' }) : undefined

  it('returns undefined for an empty detection result', () => {
    expect(selectAdapter([], lookup)).toBeUndefined()
  })

  it('keeps an unrecognized adapter id in the pool instead of dropping it', () => {
    const detected: readonly DetectedSource[] = [
      { adapterId: 'unknown-adapter', confidence: 'high', evidence: [] },
    ]

    expect(selectAdapter(detected, lookup)?.adapterId).toBe('unknown-adapter')
  })
})
