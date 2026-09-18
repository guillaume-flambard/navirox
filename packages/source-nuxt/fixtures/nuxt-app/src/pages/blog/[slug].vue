<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <p>{{ route.params.slug }}</p>
</template>
