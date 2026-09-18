export function navigate(path) {
  history.pushState({}, '', path)
}
