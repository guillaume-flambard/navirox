<script setup lang="ts">
import { ref, watch } from 'vue'

const count = ref(0)

watch(count, (value) => {
  console.log(value)
})
</script>

<template>
  <p>{{ count }}</p>
</template>
