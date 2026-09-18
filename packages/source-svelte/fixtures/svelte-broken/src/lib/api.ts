export async function ping(): Promise<void> {
  await fetch('/ping')
}
