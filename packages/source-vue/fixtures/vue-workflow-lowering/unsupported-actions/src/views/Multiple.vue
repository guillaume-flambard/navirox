<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

function update(): void {
  count.value += 1
  count.value += 1
}
</script>

<template>
  <button type="button" @click="update">Update</button>
</template>
