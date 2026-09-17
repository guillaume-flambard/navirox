<!--
  The writing half of the shared store.

  It renders no derived value at all, only the two buttons that call the store's
  actions and the field bound to its name. That is deliberate: with the readout in
  a sibling component, a screenshot where the numbers moved is proof that the
  state lives in the store rather than in either component.

  `v-model` writes straight to the store, which is what a setup store is for: the
  ref it returns is writable, so the native input needs no local state and no
  handler.
-->
<script setup lang="ts">
import { useCanary } from '../stores/canary';

const canary = useCanary();
</script>

<template>
  <view class="controls">
    <view class="row">
      <pressable class="button" @press="canary.increment">
        <text class="button-label">Press me</text>
      </pressable>
      <pressable class="button ghost" @press="canary.reset">
        <text class="button-label ghost-label">Reset</text>
      </pressable>
    </view>

    <text-input v-model="canary.name" class="input" placeholder="Type a name" />
  </view>
</template>

<style scoped>
.controls {
  margin-bottom: 12;
}

.row {
  flex-direction: row;
  margin-bottom: 12;
}

.button {
  flex: 1;
  padding: 12;
  border-radius: 10;
  align-items: center;
  background-color: #5b8cff;
  margin-right: 8;
}

.ghost {
  background-color: transparent;
  border-width: 1;
  border-color: #38425e;
  margin-right: 0;
}

.button-label {
  font-size: 15;
  font-weight: 600;
  color: #ffffff;
}

.ghost-label {
  color: #aab4cc;
}

.input {
  padding: 10;
  border-radius: 10;
  border-width: 1;
  border-color: #38425e;
  background-color: #0f1526;
  color: #ffffff;
  margin-bottom: 6;
}
</style>
