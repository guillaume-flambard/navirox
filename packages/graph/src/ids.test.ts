import { describe, expect, it } from 'vitest'
import { findingId, nodeId, normalizePath } from './ids'

describe('normalizePath', () => {
  it('collapses equivalent spellings of one file', () => {
    const expected = 'src/pages/profile.vue'
    expect(normalizePath('./src/pages/profile.vue')).toBe(expected)
    expect(normalizePath('src//pages/profile.vue')).toBe(expected)
    expect(normalizePath('src\\pages\\profile.vue')).toBe(expected)
    expect(normalizePath('././src/pages/profile.vue')).toBe(expected)
    expect(normalizePath('src/pages/profile.vue/')).toBe(expected)
  })
})

describe('nodeId', () => {
  const parts = {
    adapterId: 'vue',
    path: 'src/pages/profile.vue',
    kind: 'screen',
    key: 'default',
  } as const

  it('is stable across calls', () => {
    expect(nodeId(parts)).toBe(nodeId(parts))
  })

  it('begins with the adapter that produced it', () => {
    expect(nodeId(parts).startsWith('vue:')).toBe(true)
  })

  it('does not change when the path is spelled differently', () => {
    expect(nodeId({ ...parts, path: './src/pages/profile.vue' })).toBe(nodeId(parts))
    expect(nodeId({ ...parts, path: 'src\\pages\\profile.vue' })).toBe(nodeId(parts))
  })

  it('separates nodes that differ by kind or key', () => {
    expect(nodeId(parts)).not.toBe(nodeId({ ...parts, kind: 'component' }))
    expect(nodeId(parts)).not.toBe(nodeId({ ...parts, key: 'header' }))
  })

  it('follows the documented pattern', () => {
    expect(nodeId(parts)).toBe('vue:src/pages/profile.vue:screen:default')
  })
})

describe('findingId', () => {
  it('is deterministic and names the adapter', () => {
    const parts = { adapterId: 'vue', code: 'unsupported-syntax', key: 'profile.vue:12' }
    expect(findingId(parts)).toBe(findingId(parts))
    expect(findingId(parts)).toBe('vue:finding:unsupported-syntax:profile.vue:12')
  })
})
