import { RUNTIME_INJECTION_KEY } from '@navirox/runtime'
import type { NativeRuntime, NaviroxComponent } from '@navirox/runtime'
import { inject, type InjectionKey } from 'vue'

/**
 * The injection key, typed for Vue.
 *
 * The seam declares it as a plain symbol so it needs no Vue value import, and the
 * cast happens once, here, where Vue is already in the imports.
 */
const RUNTIME_KEY = RUNTIME_INJECTION_KEY as InjectionKey<NativeRuntime>

/**
 * The runtime the current tree was mounted by.
 *
 * Injected rather than imported. A component in this package is a façade over
 * whatever engine the app chose, so it cannot reach for one, and the app has
 * already built and mounted the one it wants. Throws when there is none, because
 * every way that happens is a setup mistake whose symptom would otherwise be a
 * blank or broken screen rather than a sentence naming the problem.
 */
export function useRuntime(): NativeRuntime {
  const runtime = inject(RUNTIME_KEY, undefined)

  if (runtime === undefined) {
    throw new Error(
      'This component needs a Navirox runtime, and none was provided above it. ' +
        'A runtime provides itself when it mounts, so this component can only be used inside an app mounted by one. ' +
        'If the app mounts through a runtime of its own, that runtime is responsible for providing itself under RUNTIME_INJECTION_KEY from @navirox/runtime.',
    )
  }

  return runtime
}

/**
 * A component the runtime supplies by import, resolved by tag.
 *
 * This is how a façade reaches a list: the runtime publishes what the renderer
 * gives it, and Navirox names and types the result. Throws rather than returning
 * undefined, so a runtime swap that cannot back a façade fails where the façade
 * is used, naming the tag and the runtime.
 */
export function useRuntimeComponent(tag: string): NaviroxComponent {
  const runtime = useRuntime()
  const component = runtime.components[tag]

  if (component === undefined) {
    throw new Error(
      `The "${runtime.id}" runtime does not provide a component for "${tag}", which this component is built on.`,
    )
  }

  return component
}
