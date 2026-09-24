<script setup>
import { ref } from 'vue'

const status = ref('Draft')

function save() {
  status.value = 'Saved'
}
</script>

<template>
  <section>
    <h2>About</h2>
    <p>{{ status }}</p>
    <button type="button" @click="save">Save</button>
  </section>
</template>
