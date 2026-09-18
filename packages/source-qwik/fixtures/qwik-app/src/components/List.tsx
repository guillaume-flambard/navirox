import { component$, useStore } from '@builder.io/qwik'

export const List = component$(() => {
  const state = useStore({ rows: [] as string[] })

  return (
    <ul>
      {state.rows.map((row) => (
        <li key={row}>{row}</li>
      ))}
    </ul>
  )
})
