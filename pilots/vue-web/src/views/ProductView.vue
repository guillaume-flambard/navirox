<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useCatalogueStore } from '../stores/catalogue'

const props = defineProps<{ id: string }>()

const catalogue = useCatalogueStore()

const productId = computed(() => Number(props.id))
const product = computed(() => catalogue.byId(productId.value))

onMounted(() => {
  void catalogue.load()
})
</script>

<template>
  <main>
    <p><RouterLink to="/">← Back to products</RouterLink></p>
    <template v-if="product">
      <h1>{{ product.name }}</h1>
      <p class="price">{{ product.price }} EUR</p>
      <button type="button" @click="catalogue.toggle(product.id)">
        {{ catalogue.has(product.id) ? 'Remove favourite' : 'Add favourite' }}
      </button>
    </template>
    <p v-else-if="catalogue.status === 'loading'">Loading product…</p>
    <p v-else>Unknown product.</p>
  </main>
</template>

<style scoped>
.price {
  font-size: 1.25rem;
}
</style>
