<script setup>
import { ref, watch } from 'vue'

const value = ref(0)

watch(value, () => {})
</script>

<template>
  <section>
    <h2>Refused</h2>
    <p>{{ value }}</p>
  </section>
</template>
