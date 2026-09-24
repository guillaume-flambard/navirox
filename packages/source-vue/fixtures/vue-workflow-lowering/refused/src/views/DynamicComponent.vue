<script lang="ts">
export default {
  data() {
    return { current: 'div' }
  },
}
</script>

<template>
  <component :is="current" />
</template>
