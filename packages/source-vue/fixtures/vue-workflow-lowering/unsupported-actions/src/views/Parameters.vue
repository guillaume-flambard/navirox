<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

function update(value: number): void {
  count.value = value
}
</script>

<template>
  <button type="button" @click="update">Update</button>
</template>
