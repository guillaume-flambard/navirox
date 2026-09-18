import { describe, expect, it } from 'vitest'
import { CAPABILITY_PATTERNS, DECLARED_CAPABILITIES, scanCapabilities } from './capabilities.js'

/**
 * The scan is shared vocabulary now, so its shape is pinned here.
 *
 * Two adapters report these names and usage kinds, and a report is compared
 * across frameworks. A name that drifted in one adapter would show up as a
 * difference between frameworks rather than as a bug in one of them.
 */

/** The closed usage set, as the graph spec declares it. */
const USAGE_KINDS = ['read', 'write', 'invoke', 'render', 'unknown']

describe('the shared capability vocabulary', () => {
  it('declares a non empty, unique, sorted set of names', () => {
    expect(DECLARED_CAPABILITIES.length).toBeGreaterThan(5)
    expect(new Set(DECLARED_CAPABILITIES).size).toBe(DECLARED_CAPABILITIES.length)
    expect([...DECLARED_CAPABILITIES]).toEqual([...DECLARED_CAPABILITIES].sort())
  })

  it('only uses usage kinds the model declares', () => {
    for (const pattern of CAPABILITY_PATTERNS) {
      expect(USAGE_KINDS).toContain(pattern.usage)
      expect(DECLARED_CAPABILITIES).toContain(pattern.capability)
    }
  })
})

describe('scanning source text', () => {
  it('tells a read from a write', () => {
    expect(scanCapabilities("const saved = localStorage.getItem('visits')")).toEqual([
      { capability: 'local-storage', usage: 'read', line: 1 },
    ])
    expect(scanCapabilities("localStorage.setItem('visits', '1')")).toEqual([
      { capability: 'local-storage', usage: 'write', line: 1 },
    ])
  })

  it('reports a framework data helper as the same network request as a plain fetch', () => {
    expect(scanCapabilities("const { data } = await useFetch('/api/rows')")).toEqual([
      { capability: 'network-request', usage: 'invoke', line: 1 },
    ])
    expect(scanCapabilities("await $fetch('/api/rows')")).toEqual([
      { capability: 'network-request', usage: 'invoke', line: 1 },
    ])
  })

  it('reports a use with no direction as unknown rather than guessing', () => {
    expect(scanCapabilities('return localStorage')).toEqual([
      { capability: 'local-storage', usage: 'unknown', line: 1 },
    ])
  })

  it('keeps exact line numbers and ignores comments', () => {
    const text = ['// localStorage.getItem("ignored")', 'const a = 1', 'localStorage.clear()'].join(
      '\n',
    )

    expect(scanCapabilities(text)).toEqual([
      { capability: 'local-storage', usage: 'write', line: 3 },
    ])
  })

  it('does not report DOM access for a line a specific capability explained', () => {
    const specific = scanCapabilities("window.localStorage.setItem('a', '1')")
    const generic = scanCapabilities('const node = document.querySelector("#app")')

    expect(specific.map((match) => match.capability)).not.toContain('dom')
    expect(generic).toEqual([{ capability: 'dom', usage: 'unknown', line: 1 }])
  })

  it('is deterministic', () => {
    const text = "navigator.geolocation.getCurrentPosition(fn)\nlocalStorage.getItem('a')"

    expect(scanCapabilities(text)).toEqual(scanCapabilities(text))
  })
})
