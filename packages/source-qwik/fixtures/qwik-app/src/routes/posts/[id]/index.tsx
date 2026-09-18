import { component$ } from '@builder.io/qwik'
import { useLocation } from '@builder.io/qwik-city'

export default component$(() => {
  const { params } = useLocation()

  return <h1>Row {params.id}</h1>
})
