<script>
  import { count, doubled } from '../stores/counter'
</script>

<button onclick={() => count.update((value) => value + 1)}>{$doubled}</button>
