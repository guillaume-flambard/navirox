<!--
  The Navirox basic example. It exists to prove two things at once.

  1. Proof A. A Vue 3 single file component with real reactivity renders as
     native views on iOS and Android through the Navirox runtime.
  2. The NX-005 acceptance criterion. The <style scoped> block at the bottom is
     ordinary CSS. Metro compiles it through the Vue SFC transformer and the CSS
     parser into native style objects, so if the card below is laid out and
     coloured correctly then the preset is wired.

  Most of the tags are renderer intrinsics. `<view>`, `<text>`, `<pressable>`,
  `<text-input>`, `<scroll-view>` and `<image>` are lowercase because they are
  host primitives rather than components to import. `FlatList` is the exception,
  and it is not a primitive at all: a list virtualizes, so it owns state and the
  renderer ships it as a component. It is imported from @navirox/ui, our façade
  over whichever engine is underneath. Nothing here imports @symbiote-native/*:
  that is the point of the example.
-->
<script setup lang="ts">
import { FlatList } from '@navirox/ui';
import { computed, ref } from 'vue';

const count = ref(0);
const doubled = computed(() => count.value * 2);
const history = ref<number[]>([]);
const name = ref('');

/** The primitives this app promises to render, shown as a scrollable strip. */
const primitives = [
  'view',
  'text',
  'pressable',
  'text-input',
  'scroll-view',
  'image',
];

const rows = [
  { id: 'one', label: 'A list row' },
  { id: 'two', label: 'Another row' },
  { id: 'three', label: 'A third row' },
  { id: 'four', label: 'A fourth row' },
  { id: 'five', label: 'A fifth row' },
  { id: 'six', label: 'A sixth row' },
];

function keyOf(row: { id: string }): string {
  return row.id;
}

/**
 * A 1x1 PNG. The image primitive needs a source and a size, and a data URI keeps
 * the canary off the network, so it renders the same on any machine.
 */
const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==';

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
        A ref, a computed and a list, all driving native views. No web layer in
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

      <text-input v-model="name" class="input" placeholder="Type a name" />
      <text class="computed">hello {{ name === '' ? 'nobody' : name }}</text>

      <horizontal-scroll-view class="strip">
        <view v-for="primitive in primitives" :key="primitive" class="chip">
          <text class="chip-label">{{ primitive }}</text>
        </view>
      </horizontal-scroll-view>

      <view class="inline">
        <image class="thumb" :source="{ uri: PIXEL }" />
        <text class="inline-label">the image primitive, sized by CSS</text>
      </view>
    </view>

    <FlatList class="list" :data="rows" :key-extractor="keyOf">
      <template #item="{ item }">
        <view class="list-row">
          <text class="list-label">{{ item.label }}</text>
        </view>
      </template>
    </FlatList>
  </view>
</template>

<style scoped>
.root {
  flex: 1;
  padding: 20;
  background-color: #0b1020;
}

.card {
  padding: 16;
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
  margin-bottom: 8;
}

.body {
  font-size: 14;
  color: #aab4cc;
  margin-bottom: 14;
}

.counter {
  align-items: center;
  margin-bottom: 14;
}

.count {
  font-size: 44;
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

.computed {
  font-size: 13;
  color: #7c8db5;
  margin-bottom: 4;
}

.input {
  padding: 10;
  border-radius: 10;
  border-width: 1;
  border-color: #38425e;
  background-color: #0f1526;
  color: #ffffff;
  margin-top: 8;
  margin-bottom: 6;
}

.strip {
  margin-bottom: 10;
}

/**
 * The list is its own scroll container, and it sits outside any other scroller
 * on purpose: a vertical `scroll-view` around a list of the same orientation
 * defeats the virtualization, which is why a list is a component and not a tag.
 */
.list {
  flex: 1;
  margin-top: 10;
}

.chip {
  padding: 8;
  border-radius: 20;
  background-color: #1f2740;
  margin-right: 8;
}

.chip-label {
  font-size: 12;
  color: #aab4cc;
}

.inline {
  flex-direction: row;
  align-items: center;
  margin-bottom: 12;
}

.thumb {
  width: 32;
  height: 32;
  border-radius: 6;
  background-color: #5b8cff;
  margin-right: 10;
}

.inline-label {
  font-size: 13;
  color: #7c8db5;
}

.list-row {
  padding: 10;
  border-radius: 8;
  background-color: #0f1526;
  margin-bottom: 6;
}

.list-label {
  font-size: 14;
  color: #dfe5f2;
}
</style>
