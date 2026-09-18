import { loadRows } from '../../../src/lib/api'

export async function GET(): Promise<Response> {
  return Response.json(await loadRows())
}
