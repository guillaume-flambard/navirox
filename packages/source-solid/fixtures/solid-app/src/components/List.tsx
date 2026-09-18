import { For } from 'solid-js'
import { counter } from '../stores/counter'

export function List() {
  return (
    <ul>
      <For each={counter.rows}>{(row) => <li>{row}</li>}</For>
    </ul>
  )
}
