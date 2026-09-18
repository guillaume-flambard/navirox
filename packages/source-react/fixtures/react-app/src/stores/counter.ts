import { create } from 'zustand'

interface CounterState {
  readonly count: number
  readonly rows: readonly string[]
  readonly increment: () => void
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  rows: ['one', 'two', 'three'],
  increment: () => set((state) => ({ count: state.count + 1 })),
}))
