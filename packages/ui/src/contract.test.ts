import { createSSRApp, h, type Component, type InjectionKey } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { RUNTIME_INJECTION_KEY, type NativeRuntime } from '@memolabs-apps/runtime'
import { createStubRuntime } from '@memolabs-apps/runtime/stub'
import { describe, expect, it } from 'vitest'
import {
  createComponentSurface,
  FlatList,
  REQUIRED_COMPONENTS,
  REQUIRED_HOST_COMPONENTS,
} from './index.js'

/**
 * The seam contract, which the plan calls Proof B: `@memolabs-apps/ui` compiles and
 * works against a runtime the seam itself supplies, with no renderer anywhere in
 * this file or in the graph behind it.
 *
 * The stub is a real implementation of the interface rather than a mock, which is
 * what makes this a contract rather than a rehearsal: if this façade needed
 * anything the interface does not promise, this file could not be written.
 *
 * The façade's own tests cover the edge cases. This file covers the promise.
 */

const RUNTIME_KEY = RUNTIME_INJECTION_KEY as InjectionKey<NativeRuntime>

function render(component: Component, runtime?: NativeRuntime): Promise<string> {
  const app = createSSRApp({ render: () => h(component) })

  if (runtime !== undefined) {
    app.provide(RUNTIME_KEY, runtime)
  }

  return renderToString(app)
}

describe('the seam contract', () => {
  it('finds every primitive and component 0.1 promises in a bare stub runtime', () => {
    const surface = createComponentSurface(createStubRuntime())

    expect(surface.platforms.length).toBeGreaterThan(0)

    for (const tag of REQUIRED_HOST_COMPONENTS) {
      expect(surface.tags).toContain(tag)
    }
    for (const tag of REQUIRED_COMPONENTS) {
      expect(Object.keys(surface.mountable)).toContain(tag)
    }
  })

  it('renders the list through the component the runtime supplies', async () => {
    const seen: { data?: readonly unknown[] }[] = []
    const engine: Component = (props) => {
      seen.push(props as { data?: readonly unknown[] })
      return h('text', `rows:${props.data?.length ?? 0}`)
    }
    const runtime: NativeRuntime = { ...createStubRuntime(), components: { 'flat-list': engine } }

    const html = await render(
      { render: () => h(FlatList, { data: [{ id: 'a' }, { id: 'b' }] }) },
      runtime,
    )

    expect(seen).toHaveLength(1)
    expect(seen[0]?.data).toHaveLength(2)
    expect(html).toContain('rows:2')
  })

  it('names the runtime and the component when the runtime cannot back one', async () => {
    const runtime = createStubRuntime({ components: [] })

    await expect(render({ render: () => h(FlatList, { data: [] }) }, runtime)).rejects.toThrow(
      /does not provide a component for "flat-list"/,
    )
  })
})
