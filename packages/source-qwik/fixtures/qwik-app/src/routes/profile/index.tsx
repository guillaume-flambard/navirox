import { component$ } from '@builder.io/qwik'

export default component$(() => {
  const locate = () => {
    navigator.geolocation.getCurrentPosition(() => {})
  }

  return <button onClick$={locate}>Where am I</button>
})
