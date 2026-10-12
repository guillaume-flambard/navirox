import { fileURLToPath } from 'node:url'
import { createProjectFiles } from '@memolabs-apps/source'
import { describe, expect, it } from 'vitest'
import { inspect, inspectStatePortability } from './index'

const pureStore = `import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const increment = () => {
    count.value += 1
  }

  return { count, increment }
})
`

const impureStore = `import { defineStore } from 'pinia'

export const useRemoteStore = defineStore('remote', async () => {
  const response = await fetch('/api/remote')
  localStorage.setItem('remote', response)
  setTimeout(() => undefined, 10)
  return { response }
})
`

const dynamicImport = `import { defineStore } from 'pinia'

const loadRemote = () => import('./remote')

export const useLazyStore = defineStore('lazy', () => ({ loadRemote }))
`

const unresolvedImport = `import { defineStore } from 'pinia'
import { missing } from '@/missing'

export const useMissingStore = defineStore('missing', () => ({ missing }))
`

const relativeImport = `import { defineStore } from 'pinia'
import { helper } from './helper'

export const useRelativeStore = defineStore('relative', () => ({ helper }))
`

const rootAbsoluteImport = `import { defineStore } from 'pinia'
import { rootValue } from '/src/root'

export const useRootStore = defineStore('root', () => ({ rootValue }))
`

const unsupportedComposable = `export const useX = createX()
`

const thirdArgumentStore = `import { defineStore } from 'pinia'

export const useThirdArgumentStore = defineStore('third', () => ({ count: 0 }), { persist: true })
`

const effectSource = `import { defineStore } from 'pinia'

export const useEffectStore = defineStore('effects', () => {
  const socket = new WebSocket('wss://example.test')
  const request = new XMLHttpRequest()
  localStorage.clear()
  document.body.innerHTML = '<div />'
  return { socket, request }
})
`

const pureComposable = `import { computed, ref } from 'vue'

export const useCounter = (initial = 0) => {
  const count = ref(initial)
  const doubled = computed(() => count.value * 2)
  return { count, doubled }
}
`

const descriptor = (id: string): string =>
  JSON.stringify({
    id,
    assertions: [
      { expression: 'count', expected: '0' },
      { expression: 'increment()', expected: '1' },
    ],
  })

const pureDescriptor = descriptor('pure-store')

function blockerMatchesFileAndLine(blocker: string, file: string): boolean {
  return new RegExp(`${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\d+`).test(blocker)
}

function fixture(name: string): string {
  return fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url))
}

describe('state portability evidence', () => {
  it('recognizes an approved Pinia setup store', () => {
    const evidence = inspectStatePortability('pure.ts', pureStore, pureDescriptor)

    expect(evidence?.profile).toBe('pinia-setup')
    expect(evidence?.status).toBe('approved')
    expect(evidence?.syntax).toBe('defineStore-setup')
    expect(evidence?.imports).toEqual([
      { specifier: 'pinia', status: 'allowed' },
      { specifier: 'vue', status: 'allowed' },
    ])
    expect(evidence?.effects).toEqual([])
    expect(evidence?.fixture.status).toBe('pending')
    expect(evidence?.fixture.assertions).toEqual([
      { expression: 'count', expected: '0' },
      { expression: 'increment()', expected: '1' },
    ])
  })

  it('classifies known effects as manual', () => {
    const evidence = inspectStatePortability('remote.ts', impureStore, descriptor('remote-store'))

    expect(evidence?.status).toBe('manual')
    expect(evidence?.effects).toEqual(['async', 'network', 'storage', 'timer'])
    expect(evidence?.blockers).toEqual(
      expect.arrayContaining([
        expect.stringContaining('unsupported-state-effect'),
        expect.stringContaining('remote.ts:'),
      ]),
    )
  })

  it('classifies a dynamic import as unknown', () => {
    const evidence = inspectStatePortability('lazy.ts', dynamicImport, descriptor('lazy-store'))

    expect(evidence?.status).toBe('unknown')
    expect(evidence?.imports).toContainEqual({ specifier: './remote', status: 'unresolved' })
    expect(evidence?.blockers).toEqual(
      expect.arrayContaining([expect.stringContaining('dynamic-state-import')]),
    )
  })

  it('classifies an unresolved static import as unknown', () => {
    const evidence = inspectStatePortability(
      'missing.ts',
      unresolvedImport,
      descriptor('missing-store'),
    )

    expect(evidence?.status).toBe('unknown')
    expect(evidence?.imports).toContainEqual({
      specifier: '@/missing',
      status: 'unresolved',
    })
    expect(evidence?.blockers).toEqual(
      expect.arrayContaining([expect.stringContaining('unresolved-state-import')]),
    )
  })

  it('keeps relative imports manual', () => {
    const evidence = inspectStatePortability(
      'relative.ts',
      relativeImport,
      descriptor('relative-store'),
    )

    expect(evidence?.status).toBe('manual')
    expect(evidence?.imports).toContainEqual({ specifier: './helper', status: 'disallowed' })
    expect(evidence?.blockers).toEqual(
      expect.arrayContaining([expect.stringContaining('relative-state-import')]),
    )
  })

  it('treats a root-absolute import as unresolved', () => {
    const evidence = inspectStatePortability(
      'root.ts',
      rootAbsoluteImport,
      descriptor('root-store'),
    )

    expect(evidence?.status).toBe('unknown')
    expect(evidence?.imports).toContainEqual({ specifier: '/src/root', status: 'unresolved' })
    expect(evidence?.blockers).toEqual(
      expect.arrayContaining([expect.stringContaining('unresolved-state-import')]),
    )
    expect(evidence?.blockers).not.toEqual(
      expect.arrayContaining([expect.stringContaining('relative-state-import')]),
    )
  })

  it('keeps a non-profile static import manual', () => {
    const text = `import { defineStore } from 'pinia'
import { get } from 'lodash'

export const useImportedStore = defineStore('imported', () => ({ get }))
`

    const evidence = inspectStatePortability('imported.ts', text, descriptor('imported-store'))

    expect(evidence?.status).toBe('manual')
    expect(evidence?.imports).toContainEqual({ specifier: 'lodash', status: 'disallowed' })
    expect(evidence?.blockers).toEqual(
      expect.arrayContaining([expect.stringContaining('unsupported-state-import')]),
    )
  })

  it('returns manual evidence for an unsupported exported useX form', () => {
    const evidence = inspectStatePortability(
      'useX.ts',
      unsupportedComposable,
      descriptor('unsupported-composable'),
    )

    expect(evidence?.profile).toBe('composable-pure')
    expect(evidence?.status).toBe('manual')
    expect(evidence?.blockers).toEqual(
      expect.arrayContaining([expect.stringContaining('unsupported-state-profile useX.ts:1')]),
    )
  })

  it('rejects a setup store with a third options argument', () => {
    const evidence = inspectStatePortability(
      'third.ts',
      thirdArgumentStore,
      descriptor('third-argument-store'),
    )

    expect(evidence?.status).toBe('manual')
    expect(evidence?.blockers).toEqual(
      expect.arrayContaining([expect.stringContaining('unsupported-state-profile third.ts:3')]),
    )
  })

  it('does not treat a Map clear operation as storage', () => {
    const text = `export const useMap = () => {
  const values = new Map()
  values.clear()
  return values
}
`
    const evidence = inspectStatePortability('useMap.ts', text, descriptor('map-composable'))

    expect(evidence?.status).toBe('approved')
    expect(evidence?.effects).toEqual([])
  })

  it('detects network constructors, storage clearing, and DOM writes', () => {
    const evidence = inspectStatePortability('effects.ts', effectSource, descriptor('effect-store'))

    expect(evidence?.status).toBe('manual')
    expect(evidence?.effects).toEqual(expect.arrayContaining(['network', 'storage', 'dom']))
    expect(evidence?.blockers).toEqual(
      expect.arrayContaining([
        expect.stringContaining('unsupported-state-effect effects.ts:4 effect network'),
        expect.stringContaining('unsupported-state-effect effects.ts:6 effect storage'),
        expect.stringContaining('unsupported-state-effect effects.ts:7 effect dom'),
      ]),
    )
  })

  it('recognizes an exported pure composable', () => {
    const evidence = inspectStatePortability(
      'useCounter.ts',
      pureComposable,
      descriptor('pure-composable'),
    )

    expect(evidence?.profile).toBe('composable-pure')
    expect(evidence?.status).toBe('approved')
    expect(evidence?.syntax).toBe('exported-useX-composable')
    expect(evidence?.imports).toEqual([{ specifier: 'vue', status: 'allowed' }])
  })

  it('returns manual evidence when defineStore is not imported from pinia', () => {
    const text = `import { defineStore } from 'other'
export const useCounterStore = defineStore('counter', () => ({ count: 0 }))
`
    const evidence = inspectStatePortability('wrong.ts', text, pureDescriptor)

    expect(evidence?.status).toBe('manual')
    expect(evidence?.profile).toBe('pinia-setup')
    expect(evidence?.blockers).toEqual(
      expect.arrayContaining([expect.stringContaining('unsupported-state-profile wrong.ts:2')]),
    )
    expect(evidence?.blockers.every((entry) => blockerMatchesFileAndLine(entry, 'wrong.ts'))).toBe(
      true,
    )
  })

  it('keeps the source hash stable for identical source text', () => {
    const first = inspectStatePortability('pure.ts', pureStore, pureDescriptor)
    const second = inspectStatePortability('pure.ts', pureStore, pureDescriptor)
    const changed = inspectStatePortability('pure.ts', `${pureStore}\n`, pureDescriptor)

    expect(first?.fixture.sourceHash).toBe(second?.fixture.sourceHash)
    expect(first?.fixture.sourceHash).not.toBe(changed?.fixture.sourceHash)
    expect(first?.fixture.sourceHash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('requires a valid sibling descriptor for approved evidence', () => {
    const missing = inspectStatePortability('pure.ts', pureStore)
    const invalid = inspectStatePortability('pure.ts', pureStore, '{not-json')

    expect(missing?.status).toBe('manual')
    expect(missing?.fixture.status).toBe('pending')
    expect(missing?.blockers).toEqual(
      expect.arrayContaining([expect.stringContaining('missing-behavior-fixture')]),
    )
    expect(invalid?.status).toBe('manual')
    expect(invalid?.blockers).toEqual(
      expect.arrayContaining([expect.stringContaining('invalid-behavior-fixture')]),
    )
  })

  it('puts a source file and line on every blocker', () => {
    const evidence = inspectStatePortability('remote.ts', impureStore, descriptor('remote-store'))

    expect(evidence?.blockers.length).toBeGreaterThan(0)
    expect(
      evidence?.blockers.every((blocker) => blockerMatchesFileAndLine(blocker, 'remote.ts')),
    ).toBe(true)
  })
})

describe('state portability inspection', () => {
  it('attaches approved evidence to a state module', async () => {
    const inspection = await inspect(
      createProjectFiles(fixture('vue-state-portability/pure-store')),
    )
    const unit = inspection.units.find(
      (candidate) => candidate.source.file === 'src/stores/counter.ts',
    )
    const evidence = unit?.metadata?.statePortability as
      ReturnType<typeof inspectStatePortability> | undefined

    expect(unit?.kind).toBe('state-module')
    expect(evidence?.profile).toBe('pinia-setup')
    expect(evidence?.status).toBe('approved')
    expect(inspection.findings.some((entry) => entry.code.startsWith('state-'))).toBe(false)

    const unscoped = inspection.units.find(
      (candidate) => candidate.source.file === 'src/composables/useUnscoped.ts',
    )
    const unscopedEvidence = unscoped?.metadata?.statePortability as
      ReturnType<typeof inspectStatePortability> | undefined

    expect(unscoped?.kind).toBe('utility')
    expect(unscopedEvidence?.status).toBe('manual')
    expect(unscopedEvidence?.blockers).toEqual(
      expect.arrayContaining([
        expect.stringContaining('missing-behavior-fixture src/composables/useUnscoped.ts:1'),
      ]),
    )
  })

  it('attaches composable evidence to an application utility', async () => {
    const inspection = await inspect(
      createProjectFiles(fixture('vue-state-portability/pure-composable')),
    )
    const unit = inspection.units.find(
      (candidate) => candidate.source.file === 'src/composables/useCounter.ts',
    )
    const evidence = unit?.metadata?.statePortability as
      ReturnType<typeof inspectStatePortability> | undefined

    expect(unit?.kind).toBe('utility')
    expect(evidence?.profile).toBe('composable-pure')
    expect(evidence?.status).toBe('approved')
  })

  it('emits exact source-located findings for impure, dynamic and unresolved state units', async () => {
    const impure = await inspect(createProjectFiles(fixture('vue-state-portability/impure-store')))
    const dynamic = await inspect(
      createProjectFiles(fixture('vue-state-portability/dynamic-import')),
    )
    const unresolved = await inspect(
      createProjectFiles(fixture('vue-state-portability/unresolved-import')),
    )

    expect(
      impure.findings.find((entry) => entry.code === 'unsupported-state-effect'),
    ).toMatchObject({
      source: { file: 'src/stores/remote.ts', start: { line: 3 } },
    })
    expect(dynamic.findings.find((entry) => entry.code === 'dynamic-state-import')).toMatchObject({
      source: { file: 'src/stores/lazy.ts', start: { line: 3 } },
    })
    expect(
      unresolved.findings.find((entry) => entry.code === 'unresolved-state-import'),
    ).toMatchObject({
      source: { file: 'src/stores/missing.ts', start: { line: 2 } },
    })
  })

  it('emits an exact relative-import refusal for the real fixture', async () => {
    const inspection = await inspect(
      createProjectFiles(fixture('vue-state-portability/relative-import')),
    )
    const unit = inspection.units.find(
      (candidate) => candidate.source.file === 'src/stores/relative.ts',
    )
    const evidence = unit?.metadata?.statePortability as
      ReturnType<typeof inspectStatePortability> | undefined
    const finding = inspection.findings.find((entry) => entry.code === 'relative-state-import')

    expect(evidence?.status).toBe('manual')
    expect(evidence?.imports).toContainEqual({ specifier: './helper', status: 'disallowed' })
    expect(finding).toMatchObject({
      code: 'relative-state-import',
      source: { file: 'src/stores/relative.ts', start: { line: 2 } },
    })
  })
})
