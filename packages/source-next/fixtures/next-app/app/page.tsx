import { Counter } from '../src/components/Counter'

export default function Home(): JSX.Element {
  const saved = localStorage.getItem('visits')
  localStorage.setItem('visits', String(Number(saved ?? '0') + 1))

  return (
    <main>
      <h1>{saved ?? '0'} visits</h1>
      <Counter />
    </main>
  )
}
