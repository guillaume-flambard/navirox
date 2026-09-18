import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0, rows: ['one', 'two', 'three'] }),
})
