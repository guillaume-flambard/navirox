export async function loadRows() {
  const response = await fetch('/api/rows')
  return response.json()
}
