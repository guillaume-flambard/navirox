<!--
  The pilot's favourites list, written by hand against the native primitives.

  Same job as `pilots/vue-web/src/views/FavouritesView.vue`: show the products the
  store marks as favourites, an empty line when there are none, and a way to
  remove one. "Browse products" is the root view's home switch rather than a link.
-->
<script setup lang="ts">
import { FlatList } from '@memolabs-apps/ui';
import type { Product } from '../api/products';
import { useCatalogueStore } from '../stores/catalogue';

const emit = defineEmits<{ openProduct: [id: number] }>();

const catalogue = useCatalogueStore();

function keyOf(product: Product): string {
  return String(product.id);
}
</script>

<template>
  <view class="screen">
    <text class="title">Favourites</text>

    <text
      v-if="catalogue.status === 'loading'"
      class="muted"
      testID="favourites-loading"
      >Loading products…</text
    >
    <text
      v-else-if="catalogue.favouriteProducts.length === 0"
      class="muted"
      testID="favourites-empty"
      >No favourites yet.</text
    >
    <FlatList
      v-else
      class="list"
      testID="favourites"
      :data="catalogue.favouriteProducts"
      :key-extractor="keyOf"
    >
      <template #item="{ item }">
        <view class="row" :testID="`favourite-${item.id}`">
          <pressable
            class="row-main"
            :testID="`favourite-open-${item.id}`"
            @press="emit('openProduct', item.id)"
          >
            <text class="name" :testID="`favourite-name-${item.id}`">{{
              item.name
            }}</text>
            <text class="price">{{ item.price }} EUR</text>
          </pressable>
          <pressable
            class="favourite"
            :testID="`favourite-remove-${item.id}`"
            @press="catalogue.toggle(item.id)"
          >
            <text class="favourite-label">Remove favourite</text>
          </pressable>
        </view>
      </template>
    </FlatList>
  </view>
</template>

<style scoped>
.screen {
  flex: 1;
  padding: 16;
}

.title {
  font-size: 22;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 10;
}

.muted {
  font-size: 14;
  color: #7c8db5;
}

.list {
  flex: 1;
}

.row {
  flex-direction: row;
  align-items: center;
  padding: 12;
  border-radius: 12;
  background-color: #151b2e;
  margin-bottom: 8;
}

.row-main {
  flex: 1;
}

.name {
  font-size: 16;
  color: #ffffff;
}

.price {
  font-size: 12;
  color: #7c8db5;
}

.favourite {
  padding: 8;
  border-radius: 8;
  border-width: 1;
  border-color: #38425e;
}

.favourite-label {
  font-size: 11;
  color: #aab4cc;
}
</style>
