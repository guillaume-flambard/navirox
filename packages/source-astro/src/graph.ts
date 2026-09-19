import type { AppGraphFragment } from '@memolabs-apps/graph'
import type { SourceInspection } from '@memolabs-apps/source'
import { buildFragment } from '@memolabs-apps/source'

import { ADAPTER_ID } from './detect.js'

/**
 * The fragment is the Astro adapter's declaration, so every identifier in it is
 * Astro's, including the ones for components another adapter read. The graph
 * says who produced a reading, and this adapter produced this one.
 */
export async function buildGraph(inspection: SourceInspection): Promise<AppGraphFragment> {
  return buildFragment(inspection, ADAPTER_ID)
}
