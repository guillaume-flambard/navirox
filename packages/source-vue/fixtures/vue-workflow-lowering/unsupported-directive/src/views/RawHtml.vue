<script setup lang="ts">
import { ref } from 'vue'

const raw = ref('<strong>hello</strong>')
</script>

<template>
  <div v-html="raw"></div>
</template>
