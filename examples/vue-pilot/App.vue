<!--
  The migration pilot's root, written by hand.

  What the migration wrote: `src/stores/catalogue.ts`, byte for byte from
  `pilots/vue-web`, at the path the run chose, and `.navirox/migration.json`.
  That file is not edited here. Everything else in this app is the manual work the
  run reported it could not do.

  Two of the pilot's units were classified adaptable and left behind, and they are
  the two hand-written modules: `src/api/products.ts` (the web version fetched a
  static asset through Vite's base URL) and `src/lib/favourites.ts` (the web
  version read `window.localStorage`, and the native API surface has no generic
  key/value store, so it goes through the secure store instead).

  The four views were classified native-replacement. They are written here against
  the host primitives the way the canary is, and the pilot's three routes become one
  view switch, because the native runtime has no router in 0.1. That difference is
  recorded rather than hidden.
-->
<script setup lang="ts">
import { ref } from 'vue';
import { useCatalogueStore } from './src/stores/catalogue';
import FavouritesView from './src/views/FavouritesView.vue';
import HomeView from './src/views/HomeView.vue';
import ProductView from './src/views/ProductView.vue';

type PilotView = 'home' | 'favourites' | 'product';

const catalogue = useCatalogueStore();

const view = ref<PilotView>('home');
const selected = ref<number | null>(null);

function showHome(): void {
  view.value = 'home';
}

function showFavourites(): void {
  view.value = 'favourites';
}

function showProduct(id: number): void {
  selected.value = id;
  view.value = 'product';
}
</script>

<template>
  <view class="root" testID="pilot-root">
    <view class="header">
      <pressable class="tab" testID="open-products" @press="showHome">
        <text class="tab-label">Products</text>
      </pressable>
      <pressable class="tab" testID="open-favourites" @press="showFavourites">
        <text class="tab-label" testID="favourites-count"
          >Favourites ({{ catalogue.favouriteCount }})</text
        >
      </pressable>
    </view>

    <HomeView v-if="view === 'home'" @open-product="showProduct" />
    <FavouritesView
      v-else-if="view === 'favourites'"
      @open-product="showProduct"
    />
    <ProductView v-else :id="selected" @back="showHome" />
  </view>
</template>

<style scoped>
.root {
  flex: 1;
  padding: 20;
  background-color: #0b1020;
}

.header {
  flex-direction: row;
  margin-bottom: 14;
}

.tab {
  padding: 10;
  border-radius: 10;
  background-color: #151b2e;
  margin-right: 8;
}

.tab-label {
  font-size: 13;
  color: #dfe5f2;
}
</style>
