import { describe, expect, it } from 'vitest'
import { createStubRuntime } from '@navirox/runtime/stub'
import { BUILT_ON, KNOWN_MODULES, PACKAGE_NAME, PACKAGE_ROLE, createNativeApi } from './index'

describe('@navirox/native', () => {
  it('has a stable package identity', () => {
    expect(PACKAGE_NAME).toBe('@navirox/native')
    expect(PACKAGE_ROLE.length).toBeGreaterThan(0)
  })

  it('is built on the runtime seam, never on a concrete runtime', () => {
    expect(BUILT_ON).toBe('@navirox/runtime')
  })
})

describe('@navirox/native against the runtime seam (Proof B)', () => {
  it('resolves a module through the seam without any renderer present', () => {
    const impact = () => Promise.resolve()
    const runtime = createStubRuntime({ modules: { haptics: { impact } } })
    const api = createNativeApi(runtime)

    expect(api.runtimeId).toBe('stub')
    expect(api.has('haptics')).toBe(true)
    expect(api.available()).toEqual(['haptics'])
    expect(api.require<{ impact: () => Promise<void> }>('haptics').impact).toBe(impact)
  })

  it('throws an actionable message naming the modules that do exist', () => {
    const runtime = createStubRuntime({ modules: { haptics: {} } })
    const api = createNativeApi(runtime)

    expect(() => api.require('camera')).toThrow(
      /does not expose a native module named "camera"\. Available modules: haptics\./,
    )
  })

  it('says so plainly when the runtime exposes nothing', () => {
    const api = createNativeApi(createStubRuntime())

    expect(() => api.require('camera')).toThrow(/Available modules: none\./)
  })

  it('reports which expected modules the runtime is missing', () => {
    const runtime = createStubRuntime({ modules: { haptics: {} } })

    expect(createNativeApi(runtime).missing()).toEqual(
      KNOWN_MODULES.filter((moduleId) => moduleId !== 'haptics'),
    )
  })

  it('accepts a caller-supplied expectation list', () => {
    const api = createNativeApi(createStubRuntime(), { expect: ['camera'] })

    expect(api.missing()).toEqual(['camera'])
  })
})
