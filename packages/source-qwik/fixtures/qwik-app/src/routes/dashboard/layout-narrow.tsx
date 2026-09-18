import { Slot, component$ } from '@builder.io/qwik'

export default component$(() => {
  return (
    <section class="narrow">
      <Slot />
    </section>
  )
})
