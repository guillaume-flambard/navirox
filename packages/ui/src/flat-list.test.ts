import { RUNTIME_INJECTION_KEY } from '@navirox/runtime'
import { createStubRuntime, type StubRuntime } from '@navirox/runtime/stub'
import { createSSRApp, h, type Component, type InjectionKey } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { describe, expect, it } from 'vitest'
import { FlatList } from './flat-list'
import { useRuntime, useRuntimeComponent } from './runtime'
import type { NativeRuntime } from '@navirox/runtime'

/**
 * The façade, exercised against the stub runtime.
 *
 * Rendered through the server renderer rather than a DOM: what is under test is
 * that the component reaches the runtime through the seam and renders what it
 * finds, and a string is enough to see that. No renderer, no React Native and no
 * simulator is involved, which is the point of Proof B.
 */

/** A runtime whose list renders a marker, so a test can see that it was reached. */
function runtimeWithList(): StubRuntime {
  const runtime = createStubRuntime({ components: [] })

  return {
    ...runtime,
    components: {
      'flat-list': ((props: { data?: readonly unknown[] }) =>
        h('text', `items:${props.data?.length ?? 0}`)) as Component,
    },
  }
}

function app(component: Component, runtime?: NativeRuntime): ReturnType<typeof createSSRApp> {
  const instance = createSSRApp({ render: () => h(component) })

  if (runtime !== undefined) {
    instance.provide(RUNTIME_INJECTION_KEY as InjectionKey<NativeRuntime>, runtime)
  }

  return instance
}

describe('FlatList', () => {
  it('renders the component the runtime supplies, with the items it was given', async () => {
    const html = await renderToString(
      app({ render: () => h(FlatList, { data: [1, 2, 3] }) }, runtimeWithList()),
    )

    expect(html).toContain('items:3')
  })

  it('fails with the runtime id when that runtime cannot back a list', async () => {
    const runtime = createStubRuntime({ components: [] })

    await expect(
      renderToString(app({ render: () => h(FlatList, { data: [] }) }, runtime)),
    ).rejects.toThrow(/The "stub" runtime does not provide a component for "flat-list"/)
  })

  it('fails with a sentence, not a blank screen, when nothing provided a runtime', async () => {
    await expect(renderToString(app({ render: () => h(FlatList, { data: [] }) }))).rejects.toThrow(
      /needs a Navirox runtime, and none was provided above it/,
    )
  })

  it('reaches the runtime from a plain composable too', async () => {
    const runtime = runtimeWithList()
    let seen: NativeRuntime | undefined
    let list: Component | undefined

    await renderToString(
      app(
        {
          setup() {
            seen = useRuntime()
            list = useRuntimeComponent('flat-list')
            return () => null
          },
        },
        runtime,
      ),
    )

    expect(seen?.id).toBe('stub')
    expect(list).toBe(runtime.components['flat-list'])
  })
})
