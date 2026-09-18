import { createSignal } from 'solid-js'

export function NameInput() {
  const [name, setName] = createSignal('')

  return <input value={name()} onInput={(event) => setName(event.currentTarget.value)} />
}
