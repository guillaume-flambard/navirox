<script>
  let name = $state('')
</script>

<input bind:value={name} />
{#if name.trim().length === 0}
  <p>a name is required</p>
{/if}
