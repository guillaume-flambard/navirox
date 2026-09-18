<script setup lang="ts">
definePageMeta({
  path: '/posts/:slug',
  alias: ['/a/:slug'],
  layout: 'admin',
  middleware: ['auth'],
})
</script>

<template>
  <article>
    <h1>An article</h1>
  </article>
</template>
