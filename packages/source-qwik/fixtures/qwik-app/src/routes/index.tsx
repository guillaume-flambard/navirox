import { component$ } from '@builder.io/qwik'

const saved = localStorage.getItem('visits')
const visits = saved === null ? 0 : Number(saved)
localStorage.setItem('visits', String(visits + 1))

export default component$(() => {
  return <h1>{visits} visits</h1>
})
