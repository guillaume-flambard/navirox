<!--
  The pilot's product list, written by hand against the native primitives.

  Same job as `pilots/vue-web/src/views/HomeView.vue`: render the store's products,
  say what is loading and what failed, and let a product be favourited or opened.
  The router is gone (the native runtime has no router in 0.1), so opening a
  product is an event the root view switches on rather than a navigation.
-->
<script setup lang="ts">
import { FlatList } from '@memolabs-apps/ui';
import { onMounted } from 'vue';
import type { Product } from '../api/products';
import { useCatalogueStore } from '../stores/catalogue';

const emit = defineEmits<{ openProduct: [id: number] }>();

const catalogue = useCatalogueStore();

function keyOf(product: Product): string {
  return String(product.id);
}

function favouriteLabel(id: number): string {
  return catalogue.has(id) ? 'Remove favourite' : 'Add favourite';
}

onMounted(() => {
  void catalogue.load();
});
</script>

<template>
  <view class="screen">
    <text class="title">Products</text>

    <text v-if="catalogue.status === 'loading'" class="muted" testID="loading"
      >Loading products…</text
    >
    <text v-else-if="catalogue.status === 'error'" class="error">{{
      catalogue.error
    }}</text>
    <FlatList
      v-else
      class="list"
      testID="products"
      :data="catalogue.products"
      :key-extractor="keyOf"
    >
      <template #item="{ item }">
        <view class="row" :testID="`product-${item.id}`">
          <pressable
            class="row-main"
            :testID="`product-open-${item.id}`"
            @press="emit('openProduct', item.id)"
          >
            <text class="name" :testID="`product-name-${item.id}`">{{
              item.name
            }}</text>
            <text class="price">{{ item.price }} EUR</text>
          </pressable>
          <pressable
            class="favourite"
            :testID="`toggle-${item.id}`"
            @press="catalogue.toggle(item.id)"
          >
            <text class="favourite-label" :testID="`toggle-label-${item.id}`">{{
              favouriteLabel(item.id)
            }}</text>
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

.error {
  font-size: 14;
  color: #ff9b9b;
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
