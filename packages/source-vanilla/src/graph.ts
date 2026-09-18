import type { AppGraphFragment } from '@navirox/graph'
import type { SourceInspection } from '@navirox/source'
import { buildFragment } from '@navirox/source'
import { ADAPTER_ID } from './detect.js'

/**
 * The fragment is this adapter's declaration about a project, so every identifier is the
 * vanilla adapter's, including for the modules a document happened to load.
 */
export async function buildGraph(inspection: SourceInspection): Promise<AppGraphFragment> {
  return buildFragment(inspection, ADAPTER_ID)
}
