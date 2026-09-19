import { describe, expect, it } from 'vitest'
import { assertNativeRuntime, createRuntime } from './create-runtime.js'
import { PACKAGE_NAME, PACKAGE_ROLE } from './index.js'
import { createStubRuntime } from './stub.js'

describe('@memolabs-apps/runtime', () => {
  it('has a stable package identity', () => {
    expect(PACKAGE_NAME).toBe('@memolabs-apps/runtime')
    expect(PACKAGE_ROLE.length).toBeGreaterThan(0)
  })
})

describe('createRuntime', () => {
  it('returns a runtime whose factory satisfies the seam', () => {
    const runtime = createRuntime(() => createStubRuntime({ id: 'symbiote' }))

    expect(runtime.id).toBe('symbiote')
    expect(runtime.capabilities.newArch).toBe(true)
    expect(runtime.capabilities.fabric).toBe(true)
    expect(runtime.capabilities.legacyFallback).toBe(false)
  })

  it('passes its options through to the factory', () => {
    let received: unknown
    createRuntime(
      (options) => {
        received = options
        return createStubRuntime()
      },
      { platforms: ['ios'] },
    )

    expect(received).toEqual({ platforms: ['ios'] })
  })

  it('rejects a factory that is not a function', () => {
    // Deliberate type violation: this is exactly the mistake being guarded.
    expect(() => createRuntime(undefined as never)).toThrow(/expects a RuntimeFactory function/)
  })

  it('rejects a runtime that is missing seam members', () => {
    expect(() => createRuntime(() => ({ id: 'half', version: '0.0.0' }) as never)).toThrow(
      /missing "hostComponents"[\s\S]*"mount" must be a function/,
    )
  })

  it('names every problem it finds, not just the first', () => {
    expect(() => assertNativeRuntime(null)).toThrow(/must be an object, received null/)
    expect(() => assertNativeRuntime({ id: 'x' })).toThrow(/missing "nativeModules"/)
  })

  it('requires the components an app imports, not only the tags it renders', () => {
    // A runtime that lists every primitive but cannot supply a list would render a
    // screen with no way to render a collection. Refusing it here names the missing
    // member once, instead of failing inside a template.
    const runtime = createStubRuntime() as unknown as Record<string, unknown>
    delete runtime.components

    expect(() => assertNativeRuntime(runtime)).toThrow(/missing "components"/)
  })
})

describe('createStubRuntime', () => {
  it('satisfies the seam and reports mount lifecycle', () => {
    const runtime = createStubRuntime({ modules: { haptics: { impact: () => {} } } })
    const handle = runtime.mount({}, { name: 'root' })

    expect(handle.mounted).toBe(true)
    expect(runtime.log).toContainEqual({ type: 'mount', name: 'root' })

    handle.unmount()
    expect(handle.mounted).toBe(false)
    expect(runtime.log).toContainEqual({ type: 'unmount' })
  })

  it('exposes the required host primitives', () => {
    const runtime = createStubRuntime()

    expect(Object.keys(runtime.hostComponents).sort()).toEqual([
      'image',
      'pressable',
      'scroll-view',
      'text',
      'text-input',
      'view',
    ])
    expect(runtime.hostComponents.view?.platforms).toEqual(['ios', 'android'])
  })

  it('exposes the components Navirox 0.1 imports rather than renders as tags', () => {
    const runtime = createStubRuntime()

    expect(Object.keys(runtime.components).sort()).toEqual(['flat-list'])
    expect(runtime.components['flat-list']).toBeTypeOf('function')
  })

  it('lets a caller drop a component to test a failure path', () => {
    const runtime = createStubRuntime({ components: [] })

    expect(runtime.components['flat-list']).toBeUndefined()
  })

  it('lets a caller drop a primitive or a module to test a failure path', () => {
    const runtime = createStubRuntime({
      hostComponents: ['view'],
      modules: {},
      navigation: { stack: false },
    })

    expect(runtime.hostComponents.pressable).toBeUndefined()
    expect(runtime.nativeModules.has('haptics')).toBe(false)
    expect(runtime.navigation.supports.stack).toBe(false)
    expect(runtime.navigation.supports.tabs).toBe(true)
  })

  it('reports the same module list from capabilities and the registry', () => {
    const runtime = createStubRuntime({ modules: { camera: {}, haptics: {} } })

    expect(runtime.capabilities.modules).toEqual(['camera', 'haptics'])
    expect(runtime.nativeModules.ids).toEqual(['camera', 'haptics'])
  })

  it('records a native component registration', () => {
    const runtime = createStubRuntime({ hostComponents: ['view'] })
    runtime.registerNativeComponent({ tag: 'map-view', nativeName: 'NVMapView' })

    expect(runtime.hostComponents['map-view']).toEqual({
      tag: 'map-view',
      platforms: ['ios', 'android'],
    })
    expect(runtime.log).toContainEqual({ type: 'registerNativeComponent', tag: 'map-view' })
  })
})
