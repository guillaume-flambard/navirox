import type { AppGraphFragment } from '@navirox/graph'
import type { SourceInspection } from '@navirox/source'
import { buildFragment } from '@navirox/source'

import { ADAPTER_ID } from './detect.js'

/**
 * The fragment is the Astro adapter's declaration, so every identifier in it is
 * Astro's, including the ones for components another adapter read. The graph
 * says who produced a reading, and this adapter produced this one.
 */
export async function buildGraph(inspection: SourceInspection): Promise<AppGraphFragment> {
  return buildFragment(inspection, ADAPTER_ID)
}
