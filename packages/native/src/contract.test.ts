import { createSSRApp, h, type Component, type InjectionKey } from 'vue'
import { renderToString } from 'vue/server-renderer'
import {
  HAPTICS_MODULE_ID,
  RUNTIME_INJECTION_KEY,
  SECURE_STORE_MODULE_ID,
  type HapticsModule,
  type NativeRuntime,
  type SecureStoreModule,
} from '@navirox/runtime'
import { createStubRuntime } from '@navirox/runtime/stub'
import { describe, expect, it } from 'vitest'
import { createNativeApi, useHaptics, useSecureStore } from './index.js'

/**
 * The seam contract, which the plan calls Proof B.
 *
 * `@navirox/native` works against a runtime the seam itself supplies, and no
 * provider is named in this file or in anything it imports. The stub is a real
 * implementation of the interface rather than a mock, which is what makes this a
 * contract instead of a rehearsal: if the facade needed anything the interface
 * does not promise, this file could not be written.
 *
 * The facade's own tests cover the failure paths one at a time. This file covers
 * the promise itself, in the shape an application sees it.
 */

const RUNTIME_KEY = RUNTIME_INJECTION_KEY as InjectionKey<NativeRuntime>

const calls: string[] = []

const haptics: HapticsModule = {
  impact: async () => {
    calls.push('impact')
  },
  notification: async () => {
    calls.push('notification')
  },
  selection: async () => {
    calls.push('selection')
  },
}

const secureStore: SecureStoreModule = {
  getItem: async (key) => {
    calls.push(`get:${key}`)
    return null
  },
  setItem: async (key) => {
    calls.push(`set:${key}`)
  },
  removeItem: async (key) => {
    calls.push(`remove:${key}`)
  },
}

function runtimeWithModules(): NativeRuntime {
  return createStubRuntime({
    modules: { [HAPTICS_MODULE_ID]: haptics, [SECURE_STORE_MODULE_ID]: secureStore },
  })
}

describe('the seam contract', () => {
  it('answers with the modules the runtime carries', () => {
    const api = createNativeApi(runtimeWithModules())

    expect(api.haptics()).toBe(haptics)
    expect(api.secureStore()).toBe(secureStore)
    expect(api.has(HAPTICS_MODULE_ID)).toBe(true)
    expect(api.missing()).not.toContain(HAPTICS_MODULE_ID)
  })

  it('names the runtime and the module when nothing answered for it', () => {
    const api = createNativeApi(createStubRuntime())

    expect(() => api.haptics()).toThrow(/does not expose a native module named "haptics"/)
  })

  it('reaches both modules from a component through the provided runtime', async () => {
    calls.length = 0

    const probe: Component = {
      setup() {
        const buzz = useHaptics()
        const store = useSecureStore()

        void buzz.selection()
        void store.setItem('canary.token', 'value')

        return () => h('text', 'ready')
      },
    }

    const app = createSSRApp({ render: () => h(probe) })
    app.provide(RUNTIME_KEY, runtimeWithModules())

    expect(await renderToString(app)).toContain('ready')
    expect(calls).toEqual(['selection', 'set:canary.token'])
  })
})
