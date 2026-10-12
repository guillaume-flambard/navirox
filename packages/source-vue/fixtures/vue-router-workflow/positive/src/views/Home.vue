<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const count = ref(0)
const router = useRouter()

function openProfile(): void {
  router.push({ name: 'profile', params: { id: '42' } })
}
</script>

<template>
  <p>{{ count }}</p>
  <button type="button" @click="openProfile">Profile</button>
  <RouterLink to="/settings">Settings link</RouterLink>
  <button type="button" @click="router.push('/settings')">Settings push</button>
  <RouterLink to="/profile/42">Profile link</RouterLink>
</template>
