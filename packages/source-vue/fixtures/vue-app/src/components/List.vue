<script setup lang="ts">
import { ref } from 'vue'
import { useCounterStore } from '../stores/counter'

const store = useCounterStore()
const selected = ref<string | null>(null)
</script>

<template>
  <ul>
    <li v-for="row in store.rows" :key="row" @click="selected = row">{{ row }}</li>
  </ul>
  <p v-if="selected !== null">selected {{ selected }}</p>
</template>
