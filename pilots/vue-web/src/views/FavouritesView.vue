<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useCatalogueStore } from '../stores/catalogue'

const catalogue = useCatalogueStore()
</script>

<template>
  <main>
    <h1>Favourites</h1>
    <p v-if="catalogue.status === 'loading'">Loading products…</p>
    <p v-else-if="catalogue.favouriteProducts.length === 0">
      No favourites yet. <RouterLink to="/">Browse products</RouterLink>
    </p>
    <ul v-else class="favourites">
      <li v-for="product in catalogue.favouriteProducts" :key="product.id">
        <RouterLink :to="{ name: 'product', params: { id: product.id } }">
          {{ product.name }}
        </RouterLink>
        <button type="button" @click="catalogue.toggle(product.id)">Remove favourite</button>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.favourites {
  list-style: none;
  padding: 0;
}

.favourites li {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border);
}

.favourites button {
  margin-left: auto;
}
</style>
