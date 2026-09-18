<script setup lang="ts">
const { data: rows } = await useFetch('/api/rows')
</script>

<template>
  <ul>
    <li v-for="row in rows" :key="row">{{ row }}</li>
  </ul>
</template>
