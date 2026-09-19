<!--
  The pilot's product detail, written by hand against the native primitives.

  Same job as `pilots/vue-web/src/views/ProductView.vue`: show one product by id,
  let it be favourited, and offer a way back. The web version read the id from the
  route params (`/product/:id`); here the root view holds the selection, so the id
  arrives as a prop and "Back to products" is an event.
-->
<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useCatalogueStore } from '../stores/catalogue';

const props = defineProps<{ id: number | null }>();

const emit = defineEmits<{ back: [] }>();

const catalogue = useCatalogueStore();

const product = computed(() =>
  props.id === null ? undefined : catalogue.byId(props.id),
);

onMounted(() => {
  void catalogue.load();
});
</script>

<template>
  <view class="screen" testID="product-detail">
    <pressable class="back" testID="back" @press="emit('back')">
      <text class="back-label">Back to products</text>
    </pressable>

    <template v-if="product">
      <text class="title" testID="product-name">{{ product.name }}</text>
      <text class="price">{{ product.price }} EUR</text>
      <pressable
        class="favourite"
        testID="product-toggle"
        @press="catalogue.toggle(product.id)"
      >
        <text class="favourite-label" testID="product-toggle-label">{{
          catalogue.has(product.id) ? 'Remove favourite' : 'Add favourite'
        }}</text>
      </pressable>
    </template>
    <text v-else-if="catalogue.status === 'loading'" class="muted"
      >Loading product…</text
    >
    <text v-else class="muted" testID="product-unknown">Unknown product.</text>
  </view>
</template>

<style scoped>
.screen {
  flex: 1;
  padding: 16;
}

.back {
  margin-bottom: 12;
}

.back-label {
  font-size: 13;
  color: #7c8db5;
}

.title {
  font-size: 22;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 6;
}

.price {
  font-size: 14;
  color: #aab4cc;
  margin-bottom: 12;
}

.muted {
  font-size: 14;
  color: #7c8db5;
}

.favourite {
  padding: 10;
  border-radius: 10;
  border-width: 1;
  border-color: #38425e;
  align-items: center;
}

.favourite-label {
  font-size: 13;
  color: #aab4cc;
}
</style>
