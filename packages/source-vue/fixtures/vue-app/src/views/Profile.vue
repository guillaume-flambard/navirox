<script setup lang="ts">
function locate(): void {
  navigator.geolocation.getCurrentPosition((position) => {
    console.log(position.coords.latitude)
  })
}
</script>

<template>
  <button type="button" @click="locate">Locate me</button>
</template>
