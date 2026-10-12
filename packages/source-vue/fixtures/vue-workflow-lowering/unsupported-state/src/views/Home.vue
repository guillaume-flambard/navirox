<script setup lang="ts">
import { ref } from 'vue'

const items = ref(['one', 'two'])
</script>

<template>
  <p>{{ items.length }}</p>
</template>
