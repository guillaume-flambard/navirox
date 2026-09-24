<script setup lang="ts">
import { computed, ref } from 'vue'

const count = ref(0)
const label = computed(() => `count: ${count.value}`)
const items = ref(['alpha', 'beta'])

defineProps<{ title: string }>()
defineEmits<{ (event: 'submit'): void }>()

function increment(): void {
  count.value += 1
}
</script>

<template>
  <h1>{{ label }}</h1>
  <p :title="label">{{ title }}</p>
  <span v-if="count > 0">positive</span>
  <span v-else>zero</span>
  <ul>
    <li v-for="item in items" :key="item">{{ item }}</li>
  </ul>
  <input v-model="count" type="number" />
  <button type="button" @click="increment">Increment</button>
</template>
