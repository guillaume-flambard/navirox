import type { AppGraphFragment } from '@navirox/graph'
import type { InspectContext, SourceInspection } from '@navirox/source'
import { buildFragment } from '@navirox/source'
import { createSvelteAdapter } from '@navirox/source-svelte'
import { ADAPTER_ID } from './detect.js'
import { readRoutes } from './routes.js'
import { routeFindings } from './findings.js'

/**
 * Inspects by composing, not by reimplementing.
 *
 * The Svelte adapter reads the components, the stores and the capability use,
 * and this adapter adds the one thing SvelteKit has that Svelte does not: the
 * routes its filesystem establishes. Reimplementing the reading here would be a
 * second answer to the same question, and the two would drift.
 */

export async function inspect(context: InspectContext): Promise<SourceInspection> {
  const base = await createSvelteAdapter().inspect(context)
  const { routes, findings } = readRoutes(context.files)

  return {
    descriptor: { ...base.descriptor, adapterId: ADAPTER_ID, displayName: 'SvelteKit' },
    units: base.units,
    capabilities: base.capabilities,
    dependencies: base.dependencies,
    routes,
    // The base adapter's descriptor named itself; everything else it read is
    // passed through untouched, including the findings that name their own
    // source files.
    findings: [...base.findings, ...routeFindings(findings)].sort((left, right) =>
      left.id.localeCompare(right.id),
    ),
  }
}

/**
 * The reading, mapped to graph nodes by the neutral mapper.
 *
 * Every identifier it produces starts with this adapter's id, because this
 * adapter is what produced the fragment, even though the component reading came
 * from the adapter it composes.
 */
export function buildGraph(inspection: SourceInspection): Promise<AppGraphFragment> {
  return Promise.resolve(buildFragment(inspection, ADAPTER_ID))
}
