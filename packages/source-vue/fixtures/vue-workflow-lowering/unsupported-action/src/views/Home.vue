<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

function load(): void {
  fetch('/data')
}
</script>

<template>
  <button type="button" @click="load">Load</button>
  <button type="button" @click="count++">Increment</button>
</template>
