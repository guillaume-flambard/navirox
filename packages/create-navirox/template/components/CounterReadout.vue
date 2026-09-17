<!--
  The reading half of the shared store.

  It writes nothing. Every number below is derived from the store that its sibling
  mutates, so when a button in `CounterControls` moves these numbers, what moved
  was state neither component owns. The styles are its own: a scoped block only
  reaches the elements a component renders, and both halves of the canary own
  their own layout.
-->
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useCanary } from '../stores/canary';

const { count, doubled, history, greeting } = storeToRefs(useCanary());
</script>

<template>
  <view class="readout">
    <view class="counter">
      <text class="count">{{ count }}</text>
      <text class="caption">presses</text>
    </view>

    <text class="computed">doubled: {{ doubled }}</text>
    <text v-if="history.length" class="computed"
      >recent: {{ history.join(', ') }}</text
    >
    <text class="computed">hello {{ greeting }}</text>
  </view>
</template>

<style scoped>
.readout {
  margin-bottom: 12;
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

.computed {
  font-size: 13;
  color: #7c8db5;
  margin-bottom: 4;
}
</style>
