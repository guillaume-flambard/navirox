export async function loadPosts(): Promise<string[]> {
  const response = await fetch('/api/posts')
  return (await response.json()) as string[]
}
