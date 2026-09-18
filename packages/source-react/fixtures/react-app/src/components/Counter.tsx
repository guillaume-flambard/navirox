import { useState } from 'react'

export function Counter(): JSX.Element {
  const [count, setCount] = useState(0)

  return <button onClick={() => setCount(count + 1)}>{count * 2}</button>
}
