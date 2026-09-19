import type { AppGraphFragment } from '@memolabs-apps/graph'
import type { SourceInspection } from '@memolabs-apps/source'
import { buildFragment } from '@memolabs-apps/source'
import { ADAPTER_ID } from './detect.js'

/** The reading, mapped by the neutral mapper, under this adapter's identifier. */
export function buildGraph(inspection: SourceInspection): Promise<AppGraphFragment> {
  return Promise.resolve(buildFragment(inspection, ADAPTER_ID))
}
