<script setup lang="ts">
const props = withDefaults(defineProps<{ title?: string }>(), { title: 'hello' })
void props
</script>

<template>
  <p>{{ title }}</p>
</template>
