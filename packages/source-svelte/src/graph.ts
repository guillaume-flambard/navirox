import type { AppGraphFragment } from '@navirox/graph'
import type { SourceInspection } from '@navirox/source'
import { buildFragment } from '@navirox/source'
import { ADAPTER_ID } from './detect.js'

/**
 * The reading, mapped to graph nodes.
 *
 * The mapping is neutral and lives in `@navirox/source`; it moved there at the
 * third adapter. What stays here is discovery, which is the part that differs
 * per framework.
 */
export function buildGraph(inspection: SourceInspection): Promise<AppGraphFragment> {
  return Promise.resolve(buildFragment(inspection, ADAPTER_ID))
}
