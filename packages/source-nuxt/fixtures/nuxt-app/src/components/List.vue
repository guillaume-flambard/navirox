<script setup lang="ts">
import { useRows } from '../composables/useRows'

const rows = useRows()
</script>

<template>
  <ul>
    <li v-for="row in rows" :key="row">{{ row }}</li>
  </ul>
</template>
