import { useState } from 'react'

export function NameInput(): JSX.Element {
  const [name, setName] = useState('')

  return (
    <div>
      <input value={name} onChange={(event) => setName(event.target.value)} />
      {name.trim().length === 0 ? <p>a name is required</p> : null}
    </div>
  )
}
