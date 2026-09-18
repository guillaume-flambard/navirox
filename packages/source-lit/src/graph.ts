import type { AppGraphFragment } from '@navirox/graph'
import type { SourceInspection } from '@navirox/source'
import { buildFragment } from '@navirox/source'
import { ADAPTER_ID } from './detect.js'

/**
 * The fragment is this adapter's statement, so every identifier carries its id, including for the
 * components a project registers from a file another adapter could also read.
 */
export function buildGraph(inspection: SourceInspection): Promise<AppGraphFragment> {
  return Promise.resolve(buildFragment(inspection, ADAPTER_ID))
}
