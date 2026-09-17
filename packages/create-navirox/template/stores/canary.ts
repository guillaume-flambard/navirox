import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

/**
 * The canary's state, in one store, so two components can share it.
 *
 * The plan asks for a store shared across screens. The router lands with 0.2, so
 * what is proven here is the same property at the scale the app has: two sibling
 * components, one writing and one reading, on one store instance. Nothing in
 * this file names a renderer, and Pinia is installed through the runtime's
 * `configure` seam rather than by importing anything of ours.
 *
 * A setup store rather than an options store because the app is written in
 * `<script setup>`, so the store reads the same way the component does.
 */
export const useCanary = defineStore('canary', () => {
  const count = ref(0);
  const history = ref<number[]>([]);
  const name = ref('');

  const doubled = computed(() => count.value * 2);
  const greeting = computed(() => (name.value === '' ? 'nobody' : name.value));

  /** Keeps the last five presses, so the list stays one line on a phone screen. */
  function increment(): void {
    count.value += 1;
    history.value = [...history.value, count.value].slice(-5);
  }

  function reset(): void {
    count.value = 0;
    history.value = [];
  }

  return { count, history, name, doubled, greeting, increment, reset };
});
