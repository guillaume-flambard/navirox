<!--
  The Navirox basic example. It exists to prove two things at once.

  1. Proof A. A Vue 3 single file component with real reactivity renders as
     native views on iOS and Android through the Navirox runtime.
  2. The NX-005 acceptance criterion. The <style scoped> block at the bottom is
     ordinary CSS. Metro compiles it through the Vue SFC transformer and the CSS
     parser into native style objects, so if the card below is laid out and
     coloured correctly then the preset is wired.

  The tags are renderer intrinsics. `<view>`, `<text>` and `<pressable>` are
  lowercase because they are host primitives rather than components to import.
  Nothing in this file imports a package of any kind, and specifically nothing
  imports @symbiote-native/*: that is the point of the example.
-->
<script setup lang="ts">
import { computed, ref } from 'vue';

const count = ref(0);
const doubled = computed(() => count.value * 2);
const history = ref<number[]>([]);

function increment(): void {
  count.value += 1;
  history.value = [...history.value, count.value].slice(-5);
}

function reset(): void {
  count.value = 0;
  history.value = [];
}
</script>

<template>
  <view class="root">
    <view class="card">
      <text class="eyebrow">NAVIROX BASIC</text>
      <text class="title">Reactive Vue, native views</text>
      <text class="body">
        The number below is a plain ref. The line under the buttons is a
        computed. Both drive the native view tree directly, with no web layer in
        between.
      </text>

      <view class="counter">
        <text class="count">{{ count }}</text>
        <text class="caption">presses</text>
      </view>

      <view class="row">
        <pressable class="button" @press="increment">
          <text class="button-label">Press me</text>
        </pressable>
        <pressable class="button ghost" @press="reset">
          <text class="button-label ghost-label">Reset</text>
        </pressable>
      </view>

      <text class="computed">doubled: {{ doubled }}</text>
      <text v-if="history.length" class="computed"
        >recent: {{ history.join(', ') }}</text
      >
    </view>
  </view>
</template>

<style scoped>
.root {
  flex: 1;
  padding: 24;
  background-color: #0b1020;
}

.card {
  padding: 20;
  border-radius: 16;
  background-color: #151b2e;
}

.eyebrow {
  font-size: 11;
  letter-spacing: 1.5;
  color: #7c8db5;
  margin-bottom: 6;
}

.title {
  font-size: 24;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 10;
}

.body {
  font-size: 14;
  color: #aab4cc;
  margin-bottom: 20;
}

.counter {
  align-items: center;
  margin-bottom: 20;
}

.count {
  font-size: 56;
  font-weight: 800;
  color: #5b8cff;
}

.caption {
  font-size: 12;
  letter-spacing: 1;
  color: #7c8db5;
}

.row {
  flex-direction: row;
  margin-bottom: 16;
}

.button {
  flex: 1;
  padding: 14;
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

.computed {
  font-size: 13;
  color: #7c8db5;
  margin-bottom: 4;
}
</style>
