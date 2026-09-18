export function Profile() {
  const locate = () => {
    navigator.geolocation.getCurrentPosition(() => {})
  }

  return (
    <button type="button" onClick={locate}>
      Locate
    </button>
  )
}
