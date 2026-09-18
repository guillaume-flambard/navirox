export function locate(render) {
  navigator.geolocation.getCurrentPosition(() => {
    render('somewhere')
  })
}
