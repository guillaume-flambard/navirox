import { component$, useSignal } from '@builder.io/qwik'

export const Counter = component$(() => {
  const count = useSignal(0)

  return <button onClick$={() => (count.value += 1)}>{count.value}</button>
})
