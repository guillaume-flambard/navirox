<script>
  function locate() {
    navigator.geolocation.getCurrentPosition((position) => {
      console.log(position.coords.latitude)
    })
  }
</script>

<button onclick={locate}>Locate me</button>
