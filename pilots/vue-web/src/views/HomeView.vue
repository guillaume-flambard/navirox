<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useCatalogueStore } from '../stores/catalogue'

const catalogue = useCatalogueStore()

onMounted(() => {
  void catalogue.load()
})
</script>

<template>
  <main>
    <h1>Products</h1>
    <p v-if="catalogue.status === 'loading'">Loading products…</p>
    <p v-else-if="catalogue.status === 'error'" class="error">{{ catalogue.error }}</p>
    <ul v-else class="products">
      <li v-for="product in catalogue.products" :key="product.id">
        <RouterLink :to="{ name: 'product', params: { id: product.id } }">
          {{ product.name }}
        </RouterLink>
        <span class="price">{{ product.price }} EUR</span>
        <button type="button" @click="catalogue.toggle(product.id)">
          {{ catalogue.has(product.id) ? 'Remove favourite' : 'Add favourite' }}
        </button>
      </li>
    </ul>
  </main>
</template>

<style scoped>
.products {
  list-style: none;
  padding: 0;
}

.products li {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border);
}

.price {
  margin-left: auto;
  color: var(--color-text);
}

.error {
  color: #b00020;
}
</style>
