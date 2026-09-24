<script setup>
import { ref } from 'vue'

const name = ref('')
</script>

<template>
  <main>
    <h1>Home</h1>
    <input v-model="name" />
  </main>
</template>
