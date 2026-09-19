import type { AppGraphFragment } from '@memolabs-apps/graph'
import type { SourceInspection } from '@memolabs-apps/source'
import { buildFragment } from '@memolabs-apps/source'
import { ADAPTER_ID } from './detect.js'

/**
 * The reading, mapped to graph nodes by the neutral mapper.
 *
 * Every identifier carries this adapter's id, including for the components the
 * React adapter read, because this adapter is what produced the fragment.
 */
export function buildGraph(inspection: SourceInspection): Promise<AppGraphFragment> {
  return Promise.resolve(buildFragment(inspection, ADAPTER_ID))
}
