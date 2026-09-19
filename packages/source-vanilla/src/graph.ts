import type { AppGraphFragment } from '@memolabs-apps/graph'
import type { SourceInspection } from '@memolabs-apps/source'
import { buildFragment } from '@memolabs-apps/source'
import { ADAPTER_ID } from './detect.js'

/**
 * The fragment is this adapter's declaration about a project, so every identifier is the
 * vanilla adapter's, including for the modules a document happened to load.
 */
export async function buildGraph(inspection: SourceInspection): Promise<AppGraphFragment> {
  return buildFragment(inspection, ADAPTER_ID)
}
