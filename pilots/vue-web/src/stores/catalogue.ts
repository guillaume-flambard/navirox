import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchProducts, type Product } from '../api/products'
import { useFavourites } from '../lib/favourites'

export type CatalogueStatus = 'idle' | 'loading' | 'ready' | 'error'

export const useCatalogueStore = defineStore('catalogue', () => {
  const products = ref<Product[]>([])
  const status = ref<CatalogueStatus>('idle')
  const error = ref<string | null>(null)
  const favourites = useFavourites()

  async function load(): Promise<void> {
    if (status.value === 'loading' || status.value === 'ready') {
      return
    }
    status.value = 'loading'
    try {
      products.value = await fetchProducts()
      status.value = 'ready'
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      status.value = 'error'
    }
  }

  const favouriteProducts = computed(() =>
    products.value.filter((product) => favourites.has(product.id)),
  )
  const favouriteCount = computed(() => favourites.ids.value.length)

  function byId(id: number): Product | undefined {
    return products.value.find((product) => product.id === id)
  }

  return {
    products,
    status,
    error,
    favouriteProducts,
    favouriteCount,
    load,
    byId,
    has: favourites.has,
    toggle: favourites.toggle,
  }
})
