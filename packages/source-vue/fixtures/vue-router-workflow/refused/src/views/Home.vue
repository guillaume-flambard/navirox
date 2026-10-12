<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
const target = '/settings'

function openSettings(): void {
  router.push(target)
}
</script>

<template>
  <button type="button" @click="openSettings">Settings</button>
</template>
