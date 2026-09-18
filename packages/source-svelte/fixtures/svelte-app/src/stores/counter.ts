import { derived, writable } from 'svelte/store'

export const count = writable(0)
export const rows = writable(['one', 'two', 'three'])
export const doubled = derived(count, (value) => value * 2)
