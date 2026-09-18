'use client'

import { useCounterStore } from '../stores/counter'

export function List(): JSX.Element {
  const rows = useCounterStore((state) => state.rows)

  return (
    <ul>
      {rows.map((row) => (
        <li key={row}>{row}</li>
      ))}
    </ul>
  )
}
