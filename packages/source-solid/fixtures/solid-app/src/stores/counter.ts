import { createStore } from 'solid-js/store'

export const [counter, setCounter] = createStore({ rows: [] as string[], saved: 0 })
