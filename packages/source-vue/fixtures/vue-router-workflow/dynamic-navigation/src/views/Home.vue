<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
const target = '/settings'

function openSettings(): void {
  router.push(target)
}

function openProfile(): void {
  router.push({ name: 'profile' })
}

function openSettingsTwice(): void {
  router.push('/settings')
  router.push('/settings')
}

function openSettingsWithOptions(): void {
  router.push('/settings', { replace: true })
}
</script>

<template>
  <button type="button" @click="openSettings">Settings</button>
  <button type="button" @click="openProfile">Profile</button>
  <button type="button" @click="openSettingsTwice">Settings twice</button>
  <button type="button" @click="openSettingsWithOptions">Settings options</button>
</template>
