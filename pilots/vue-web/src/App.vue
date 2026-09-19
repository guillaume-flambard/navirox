<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useCatalogueStore } from './stores/catalogue'

const catalogue = useCatalogueStore()
</script>

<template>
  <header>
    <nav>
      <RouterLink to="/">Products</RouterLink>
      <RouterLink to="/favourites">Favourites ({{ catalogue.favouriteCount }})</RouterLink>
    </nav>
  </header>

  <RouterView />
</template>

<style scoped>
nav {
  display: flex;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border);
}

nav a.router-link-exact-active {
  color: var(--color-text);
}
</style>
