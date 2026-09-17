import { describe, expect, it } from 'vitest'
import { createStubRuntime } from '@navirox/runtime/stub'
import {
  BUILT_ON,
  PACKAGE_NAME,
  PACKAGE_ROLE,
  REQUIRED_HOST_COMPONENTS,
  createComponentSurface,
  resolveHostComponents,
} from './index'

describe('@navirox/ui', () => {
  it('has a stable package identity', () => {
    expect(PACKAGE_NAME).toBe('@navirox/ui')
    expect(PACKAGE_ROLE.length).toBeGreaterThan(0)
  })

  it('is built on the runtime seam, never on a concrete runtime', () => {
    expect(BUILT_ON).toBe('@navirox/runtime')
  })
})

describe('@navirox/ui against the runtime seam (Proof B)', () => {
  it('resolves every required primitive without any renderer present', () => {
    const runtime = createStubRuntime()
    const surface = createComponentSurface(runtime)

    expect(surface.tags).toEqual([...REQUIRED_HOST_COMPONENTS])
    expect(Object.keys(surface.components).sort()).toEqual([...REQUIRED_HOST_COMPONENTS].sort())
    expect(surface.platforms).toEqual(['ios', 'android'])
  })

  it('narrows the platform list to primitives that exist on both', () => {
    const runtime = createStubRuntime({ platforms: ['ios'] })

    expect(createComponentSurface(runtime).platforms).toEqual(['ios'])
  })

  it('fails once with an actionable message when a primitive is missing', () => {
    const runtime = createStubRuntime({ hostComponents: ['view', 'text'] })

    expect(() => createComponentSurface(runtime)).toThrow(
      /The "stub" runtime does not provide "pressable", "text-input", "scroll-view"/,
    )
  })

  it('accepts a runtime that adds a primitive through registerNativeComponent', () => {
    const runtime = createStubRuntime({ hostComponents: ['view'] })
    runtime.registerNativeComponent({ tag: 'text', nativeName: 'NVText' })

    expect(resolveHostComponents(runtime, ['view', 'text'])).toHaveProperty('text')
  })
})
