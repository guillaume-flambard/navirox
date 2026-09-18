<script setup lang="ts">
import { ref } from 'vue'

const name = ref('')
</script>

<template>
  <input v-model="name" />
  <p v-if="name.trim().length === 0">a name is required</p>
</template>
