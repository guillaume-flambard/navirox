import { describe, expect, it } from 'vitest'
import { createSSRApp, h, type Component, type InjectionKey } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { RUNTIME_INJECTION_KEY, type NativeRuntime } from '@memolabs-apps/runtime'
import { createStubRuntime } from '@memolabs-apps/runtime/stub'
import { useHaptics, useNativeApi, useRuntime, useSecureStore } from './index'

/**
 * These render through Vue's server renderer rather than a DOM, because what is
 * under test is the injection path, not rendering: a component calls the facade
 * in `setup` and the assertion is on what it saw. No renderer and no device is
 * involved, which is the point of the seam.
 */
async function render(component: Component, runtime?: NativeRuntime): Promise<string> {
  const app = createSSRApp({ render: () => h(component) })

  if (runtime !== undefined) {
    app.provide(RUNTIME_INJECTION_KEY as InjectionKey<NativeRuntime>, runtime)
  }

  return await renderToString(app)
}

describe('the runtime a component can reach', () => {
  it('hands the provided runtime to a component that asks for it', async () => {
    const mark = {
      setup() {
        return () => h('text', useRuntime().id)
      },
    }

    await expect(render(mark, createStubRuntime({ id: 'canary-runtime' }))).resolves.toContain(
      'canary-runtime',
    )
  })

  it('throws a sentence that says what to do when nothing provided one', async () => {
    const bare = {
      setup() {
        useRuntime()
        return () => h('text', 'unreachable')
      },
    }

    await expect(render(bare)).rejects.toThrow(/needs a Navirox runtime/)
  })
})

describe('haptics and secure storage inside a component', () => {
  it('resolves both through the runtime, with no provider imported here', async () => {
    const calls: string[] = []
    const runtime = createStubRuntime({
      modules: {
        haptics: {
          impact: (style: string) => {
            calls.push(`impact:${style}`)
            return Promise.resolve()
          },
          notification: () => Promise.resolve(),
          selection: () => Promise.resolve(),
        },
        'secure-store': {
          getItem: (key: string) => {
            calls.push(`get:${key}`)
            return Promise.resolve('a value')
          },
          setItem: () => Promise.resolve(),
          removeItem: () => Promise.resolve(),
        },
      },
    })

    const panel = {
      setup() {
        const haptics = useHaptics()
        const store = useSecureStore()
        // Both reads happen in setup, which is where an app calls them: the
        // secure store returns a promise and the haptic call is fire and forget.
        void store.getItem('token')
        void haptics.impact('medium')

        return () => h('text', calls.join('|'))
      },
    }

    await expect(render(panel, runtime)).resolves.toContain('get:token|impact:medium')
  })

  it('reports the missing provider by module id when the runtime has none', async () => {
    const panel = {
      setup() {
        useHaptics()
        return () => h('text', 'unreachable')
      },
    }

    await expect(render(panel, createStubRuntime())).rejects.toThrow(
      /does not expose a native module named "haptics"/,
    )
  })

  it('exposes the whole facade, so an app can ask what is available', async () => {
    const runtime = createStubRuntime({ modules: { haptics: { impact: () => Promise.resolve() } } })
    // Read in setup rather than in the render function. Vue's server renderer
    // does not reset the instance it is working on when a setup throws, so a
    // render-phase `inject` after one of the failing cases above resolves
    // against the previous app, and this assertion would be reading a runtime
    // this test never provided. Setup is also where an app makes these calls.
    let seen = ''
    const list = {
      setup() {
        const api = useNativeApi()
        seen = `${api.runtimeId}:${api.available().join(',')}`

        return () => h('text', seen)
      },
    }

    await render(list, runtime)

    expect(seen).toBe('stub:haptics')
  })
})
