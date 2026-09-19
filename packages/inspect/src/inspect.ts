import type { AppGraph, FindingSeverity } from '@memolabs-apps/graph'
import { APP_GRAPH_SCHEMA_VERSION } from '@memolabs-apps/graph'
import type { InspectContext, SourceAdapterRegistry } from '@memolabs-apps/source'
import { createProjectFiles } from '@memolabs-apps/source'
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
    const selected = await options.registry.select(context)

    if (selected === undefined) {
      return failure(
        'no-adapter',
        `No supported source adapter was detected for ${options.rootDir}.`,
        registered,
      )
    }

    adapterId = selected.adapterId
  }

  const adapter = options.registry.get(adapterId)

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
