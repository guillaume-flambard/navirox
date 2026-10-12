import { computed, ref } from 'vue'

export const useCounter = (initial = 0) => {
  const count = ref(initial)
  const doubled = computed(() => count.value * 2)
  return { count, doubled }
}
