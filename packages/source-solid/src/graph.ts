import type { AppGraphFragment } from '@memolabs-apps/graph'
import type { SourceInspection } from '@memolabs-apps/source'
import { buildFragment } from '@memolabs-apps/source'
import { ADAPTER_ID } from './detect.js'

/**
 * The fragment this adapter declares.
 *
 * Every identifier carries this adapter's id, because this adapter is what
 * produced the fragment, and the builder adds nothing that was not read.
 */
export function buildGraph(inspection: SourceInspection): Promise<AppGraphFragment> {
  return Promise.resolve(buildFragment(inspection, ADAPTER_ID))
}
