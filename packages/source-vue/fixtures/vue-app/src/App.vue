<script setup lang="ts">
import Counter from './components/Counter.vue'
import List from './components/List.vue'

const saved = localStorage.getItem('visits')
const visits = saved === null ? 0 : Number(saved)
localStorage.setItem('visits', String(visits + 1))
</script>

<template>
  <main>
    <h1>{{ visits }} visits</h1>
    <Counter />
    <List />
  </main>
</template>

<style scoped>
main {
  padding: 1rem;
}
</style>
