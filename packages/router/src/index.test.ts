import { describe, expect, it } from 'vitest'
import { createStubRuntime } from '@memolabs-apps/runtime/stub'
import type { NaviroxComponent } from '@memolabs-apps/runtime'
import { BUILT_ON, PACKAGE_NAME, PACKAGE_ROLE, createRouter } from './index'

const screen = {} as NaviroxComponent

describe('@memolabs-apps/router', () => {
  it('has a stable package identity', () => {
    expect(PACKAGE_NAME).toBe('@memolabs-apps/router')
    expect(PACKAGE_ROLE.length).toBeGreaterThan(0)
  })

  it('is built on the runtime seam, never on a concrete runtime', () => {
    expect(BUILT_ON).toBe('@memolabs-apps/runtime')
  })
})

describe('@memolabs-apps/router against the runtime seam (Proof B)', () => {
  it('registers routes through the backend without any renderer present', () => {
    const runtime = createStubRuntime()
    const router = createRouter(runtime)

    router.register({ name: 'index', component: screen })
    router.register({ name: 'settings', component: screen })

    expect(router.routes).toEqual(['index', 'settings'])
    expect(runtime.screens).toEqual(['index', 'settings'])
    expect(runtime.log).toContainEqual({ type: 'registerScreen', name: 'index' })
  })

  it('reports the backend it bound to, not a library name', () => {
    const runtime = createStubRuntime({ id: 'symbiote' })

    expect(createRouter(runtime).backendId).toBe('symbiote-navigation')
  })

  it('refuses an incapable backend before registering anything', () => {
    const runtime = createStubRuntime({ navigation: { stack: false } })

    expect(() => createRouter(runtime)).toThrow(
      /does not support stack\. Navirox routing requires stack\./,
    )
    expect(runtime.screens).toEqual([])
  })

  it('checks every feature the caller requires, and names all of them', () => {
    const runtime = createStubRuntime({ navigation: { stack: false, deepLinks: false } })

    expect(() => createRouter(runtime, { require: ['stack', 'deepLinks'] })).toThrow(
      /does not support stack, deepLinks\. Navirox routing requires stack, deepLinks\./,
    )
  })

  it('accepts a backend that satisfies a stricter requirement set', () => {
    const runtime = createStubRuntime()
    const router = createRouter(runtime, { require: ['stack', 'tabs'] })

    expect(router.supports.tabs).toBe(true)
  })
})
