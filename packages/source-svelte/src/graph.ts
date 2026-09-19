import type { AppGraphFragment } from '@memolabs-apps/graph'
import type { SourceInspection } from '@memolabs-apps/source'
import { buildFragment } from '@memolabs-apps/source'
import { ADAPTER_ID } from './detect.js'

/**
 * The reading, mapped to graph nodes.
 *
 * The mapping is neutral and lives in `@memolabs-apps/source`; it moved there at the
 * third adapter. What stays here is discovery, which is the part that differs
 * per framework.
 */
export function buildGraph(inspection: SourceInspection): Promise<AppGraphFragment> {
  return Promise.resolve(buildFragment(inspection, ADAPTER_ID))
}
