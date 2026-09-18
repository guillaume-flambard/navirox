export const onRequest = async ({ next }: { next: () => Promise<unknown> }) => {
  await next()
}
