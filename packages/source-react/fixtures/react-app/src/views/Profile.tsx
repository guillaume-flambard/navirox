export function Profile(): JSX.Element {
  function locate(): void {
    navigator.geolocation.getCurrentPosition((position) => {
      console.log(position.coords.latitude)
    })
  }

  return <button onClick={locate}>Locate me</button>
}
