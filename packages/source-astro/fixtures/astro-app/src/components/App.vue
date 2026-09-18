<script setup lang="ts">
const saved = localStorage.getItem('visits')
const visits = saved === null ? 0 : Number(saved)
localStorage.setItem('visits', String(visits + 1))
</script>

<template>
  <main>
    <h1>{{ visits }} visits</h1>
  </main>
</template>
