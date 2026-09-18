<script>
  import { rows } from '../stores/counter'

  let selected = $state(null)
</script>

<ul>
  {#each $rows as row (row)}
    <li onclick={() => (selected = row)}>{row}</li>
  {/each}
</ul>
<p>{selected === null ? 'nothing selected' : `selected ${selected}`}</p>
