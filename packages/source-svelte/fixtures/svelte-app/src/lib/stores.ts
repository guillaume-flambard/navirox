import { get } from 'svelte/store'

export function current<T>(store: { subscribe: (run: (value: T) => void) => () => void }): T {
  return get(store)
}
