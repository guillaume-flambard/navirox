import { component$ } from '@builder.io/qwik'
import { useLocation } from '@builder.io/qwik-city'

export default component$(() => {
  const { params } = useLocation()

  return <h1>{params.slug}</h1>
})
