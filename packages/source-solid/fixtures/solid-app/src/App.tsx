import Counter from './components/Counter'
import List from './components/List'

export function App() {
  const saved = localStorage.getItem('visits')
  const visits = saved === null ? 0 : Number(saved)
  localStorage.setItem('visits', String(visits + 1))

  return (
    <main>
      <h1>{visits} visits</h1>
      <Counter />
      <List />
    </main>
  )
}
