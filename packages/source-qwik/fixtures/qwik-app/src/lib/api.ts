export async function loadRows(): Promise<string[]> {
  const response = await fetch('/api/rows')
  return (await response.json()) as string[]
}
