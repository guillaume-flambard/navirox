import { createStubRuntime } from '@navirox/runtime/stub'
import { describe, expect, it } from 'vitest'
import { createRouter } from './index.js'

/**
 * The seam contract, which the plan calls Proof B.
 *
 * `@navirox/router` works against a runtime the seam itself supplies, and no
 * navigation library is named in this file or in anything it imports. The stub is
 * a real implementation of the interface rather than a mock, which is what makes
 * this a contract instead of a rehearsal: if the router needed anything the
 * interface does not promise, this file could not be written. The package's own
 * tests cover the shapes one at a time, while this file covers the promise.
 */
describe('the seam contract', () => {
  it('registers routes on the navigation backend the runtime carries', () => {
    const runtime = createStubRuntime()
    const router = createRouter(runtime)

    expect(router.backendId).toBe(runtime.navigation.id)
    expect(router.supports).toEqual(runtime.navigation.supports)

    router.register({ name: 'home', component: () => null })

    expect(router.routes).toEqual(['home'])
    expect(runtime.screens).toEqual(['home'])
  })

  it('refuses a backend that cannot do what routing needs, and names it', () => {
    const runtime = createStubRuntime({ navigation: { stack: false } })

    expect(() => createRouter(runtime)).toThrow(/does not support stack/)
    expect(() => createRouter(runtime)).toThrow(new RegExp(runtime.navigation.id))
  })
})
