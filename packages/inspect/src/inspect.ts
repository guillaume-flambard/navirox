import type { AppGraph, FindingSeverity } from '@memolabs-apps/graph'
import { APP_GRAPH_SCHEMA_VERSION } from '@memolabs-apps/graph'
import { loadSeedVersionMatrix } from '@memolabs-apps/compat'
import type { DetectedSource, InspectContext, SourceAdapterRegistry } from '@memolabs-apps/source'
import {
  checkVerifiedRange,
  createProjectFiles,
  declaredRange,
  readManifest,
  selectAdapter,
} from '@memolabs-apps/source'
import {
  INSPECT_REPORT_SCHEMA_VERSION,
  type InspectFailureReason,
  type InspectOutcome,
  type InspectReport,
  type InspectionSummary,
} from './types.js'

/**
 * The inspection pipeline.
 *
 * It selects an adapter, runs it, wraps the fragment it produced in the graph
 * envelope, and counts what came back. It knows no framework: the adapter is
 * chosen through the registry, and the adapter set is composed where the command
 * is wired rather than here.
 *
 * Nothing is printed. The report is returned as data, which is what lets the
 * command line and a future migration planner share one pipeline.
 */

export interface InspectOptions {
  readonly rootDir: string
  readonly registry: SourceAdapterRegistry
  /** An adapter id that bypasses detection, or undefined to detect. */
  readonly framework?: string
}

function countFindings(graph: AppGraph): Record<FindingSeverity, number> {
  const counts: Record<FindingSeverity, number> = { info: 0, warning: 0, error: 0 }

  for (const finding of graph.findings) {
    counts[finding.severity] += 1
  }

  return counts
}

function failure(
  reason: InspectFailureReason,
  message: string,
  available: readonly string[],
): InspectOutcome {
  return { ok: false, reason, message, available }
}

function summarize(files: number, graph: AppGraph): InspectionSummary {
  return {
    files,
    units: graph.units.length,
    capabilities: graph.capabilities.length,
    dependencies: graph.dependencies.length,
    routes: graph.routes.length,
    screens: graph.screens.length,
    findings: countFindings(graph),
  }
}

function areComposed(
  left: DetectedSource,
  right: DetectedSource,
  registry: SourceAdapterRegistry,
): boolean {
  return (
    registry.get(left.adapterId).composes?.includes(right.adapterId) === true ||
    registry.get(right.adapterId).composes?.includes(left.adapterId) === true
  )
}

function competingCandidates(
  selected: DetectedSource,
  detected: readonly DetectedSource[],
  registry: SourceAdapterRegistry,
): readonly DetectedSource[] {
  return detected.filter(
    (candidate) =>
      candidate.adapterId !== selected.adapterId &&
      candidate.confidence === selected.confidence &&
      !areComposed(candidate, selected, registry),
  )
}

/**
 * The version governance gate.
 *
 * A declared npm range is never a compatibility claim on its own. After an
 * adapter is selected, the matrix decides whether the declared framework
 * version falls inside a verified range for that adapter. Outside it, the
 * inspection stops here: the outcome names the fact, its location, the
 * expected profile and a resumption path, and no inspection runs, so no graph
 * is built and no application is generated.
 *
 * An adapter the matrix does not govern, an unreadable manifest, or a
 * framework the manifest does not declare are not refusals: the adapter
 * reports those itself as findings, and this gate stays out of its way.
 */
function checkVersionGovernance(
  adapterId: string,
  context: InspectContext,
  registered: readonly string[],
): InspectOutcome | undefined {
  const rows = loadSeedVersionMatrix().rowsFor(adapterId)

  if (rows.length === 0) {
    return undefined
  }

  const manifest = readManifest(context, adapterId)

  if (manifest === undefined) {
    return undefined
  }

  const frameworks = [...new Set(rows.map((row) => row.framework))].sort()

  for (const framework of frameworks) {
    const declared = declaredRange(manifest, framework)

    if (declared === undefined) {
      continue
    }

    const governing = rows.filter((row) => row.framework === framework)
    const profiles = [...new Set(governing.map((row) => row.profile))].sort()
    const outcome = checkVerifiedRange({
      adapterId,
      profile: profiles[0] ?? adapterId,
      framework,
      verifiedVersions: governing.flatMap((row) => row.verifiedVersions),
      declaredRange: declared.range,
      location: manifest.source.file,
    })

    if (!outcome.ok) {
      const refusal = outcome.refusal

      return failure(
        'outside-verified-range',
        `Navirox cannot transform ${refusal.fact} declared in ${refusal.location}: ` +
          `the ${refusal.expectedProfile} profile is verified for ` +
          `${refusal.verifiedVersions.join(', ')} only. ` +
          `${refusal.resumption} No application was generated.`,
        registered,
      )
    }
  }

  return undefined
}

export async function runInspection(options: InspectOptions): Promise<InspectOutcome> {
  const project = createProjectFiles(options.rootDir)
  const context: InspectContext = {
    rootDir: project.rootDir,
    files: project.files,
    readText: project.readText,
  }

  const registered = options.registry.list().map((adapter) => adapter.id)

  let adapterId: string

  if (options.framework !== undefined) {
    if (!options.registry.has(options.framework)) {
      return failure(
        'unknown-adapter',
        `No adapter named "${options.framework}" is registered.`,
        registered,
      )
    }

    adapterId = options.framework
  } else {
    const detected = await options.registry.detect(context)
    const selected = selectAdapter(detected, (id) => options.registry.get(id))

    if (selected === undefined) {
      return failure(
        'no-adapter',
        `No supported source adapter was detected for ${options.rootDir}.`,
        registered,
      )
    }

    const competing = competingCandidates(selected, detected, options.registry)

    if (competing.length > 0) {
      const candidates = [selected, ...competing].map((candidate) => candidate.adapterId).sort()

      return failure(
        'ambiguous-adapter',
        `Navirox detected multiple unrelated source frameworks: ${candidates.join(', ')}. ` +
          `Choose one explicitly with ${candidates
            .map((candidate) => `--framework ${candidate}`)
            .join(' or ')}.`,
        registered,
      )
    }

    adapterId = selected.adapterId
  }

  const adapter = options.registry.get(adapterId)

  const governed = checkVersionGovernance(adapterId, context, registered)

  if (governed !== undefined) {
    return governed
  }

  try {
    const inspection = await adapter.inspect(context)
    const fragment = await adapter.buildGraph(inspection, { rootDir: options.rootDir })
    const graph: AppGraph = {
      ...fragment,
      schemaVersion: APP_GRAPH_SCHEMA_VERSION,
      source: inspection.descriptor,
    }

    const report: InspectReport = {
      schemaVersion: INSPECT_REPORT_SCHEMA_VERSION,
      rootDir: options.rootDir,
      source: inspection.descriptor,
      supportLevel: adapter.supportLevel,
      summary: summarize(context.files.length, graph),
      graph,
    }

    return { ok: true, report }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    return failure(
      'adapter-failed',
      `The "${adapterId}" adapter failed to inspect ${options.rootDir}: ${message}`,
      registered,
    )
  }
}
