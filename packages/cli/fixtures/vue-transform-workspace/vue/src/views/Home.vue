<script setup>
import { ref } from 'vue'

const name = ref('')
const count = ref(0)
</script>

<template>
  <main>
    <h1>Hello</h1>
    <p>{{ name }}</p>
    <input v-model="name" />
    <button type="button" @click="count += 1">Increment</button>
    <span v-if="count > 0">Positive</span>
    <span v-else>Zero</span>
  </main>
</template>
