<script>
  export let name = 'world'
  $: greeting = `hello ${name}`
</script>

<p>{greeting}</p>
