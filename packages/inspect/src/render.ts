import type { UnitKind } from '@memolabs-apps/graph'
import type { InspectOutcome, InspectReport } from './types.js'

/**
 * Turning a report into what a person reads.
 *
 * The order is the order of the questions a reader has: which project was read,
 * by what, what is in it, what could not be established, and what to do next.
 * "What could not be established" is a section rather than a footnote, because a
 * report that only lists what it found is a report that hides its own limits.
 */

const NEXT_STEP = 'Run `navirox inspect --json` for the full graph.'

function unitBreakdown(units: readonly { readonly kind: UnitKind }[]): string {
  const counts = new Map<UnitKind, number>()

  for (const unit of units) {
    counts.set(unit.kind, (counts.get(unit.kind) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([kind, count]) => `${count} ${kind}`)
    .join(', ')
}

export function renderReport(report: InspectReport): string {
  const lines: string[] = []
  const { summary, source, graph } = report

  lines.push('Navirox inspection')
  lines.push(`  project   ${report.rootDir}`)
  lines.push(`  adapter   ${source.displayName} (${report.supportLevel})`)
  lines.push(
    `  framework ${source.adapterId}${source.frameworkVersion === undefined ? '' : ` ${source.frameworkVersion}`}`,
  )

  lines.push('')
  lines.push('Found')
  lines.push(`  files        ${summary.files}`)
  lines.push(
    `  units        ${summary.units}${summary.units === 0 ? '' : ` (${unitBreakdown(graph.units)})`}`,
  )
  lines.push(`  capabilities ${summary.capabilities}`)
  lines.push(`  dependencies ${summary.dependencies}`)
  lines.push(`  routes       ${summary.routes}`)

  lines.push('')
  if (graph.findings.length === 0) {
    lines.push('Findings')
    lines.push('  none')
  } else {
    lines.push(`Findings (${graph.findings.length})`)
    for (const finding of graph.findings) {
      lines.push(`  ${finding.severity.padEnd(7)} ${finding.code}`)
      lines.push(`          ${finding.title}`)
      lines.push(`          ${finding.message}`)
    }
  }

  const unknowns = graph.findings.filter((finding) => finding.severity !== 'info')

  lines.push('')
  lines.push('Not determined')
  if (unknowns.length === 0) {
    lines.push('  nothing was left unresolved by this adapter')
  } else {
    for (const finding of unknowns) {
      lines.push(
        `  ${finding.title}${finding.source === undefined ? '' : ` (${finding.source.file})`}`,
      )
    }
  }

  lines.push('')
  lines.push('Next')
  lines.push(`  ${NEXT_STEP}`)

  return lines.join('\n')
}

/** The machine form: one JSON document, no prose. */
export function reportToJson(report: InspectReport): string {
  return JSON.stringify(report, null, 2)
}

/**
 * A failure, rendered the same way for both output forms.
 *
 * A caller that asked for JSON still gets JSON, so nothing has to parse prose to
 * find out that a directory has no adapter.
 */
export function renderFailure(outcome: InspectOutcome, json: boolean): string {
  if (outcome.ok) {
    throw new Error('renderFailure was called with a successful outcome')
  }

  if (json) {
    return JSON.stringify(
      { ok: false, reason: outcome.reason, message: outcome.message, available: outcome.available },
      null,
      2,
    )
  }

  const lines = [outcome.message]

  if (outcome.available.length > 0) {
    lines.push(`Registered adapters: ${outcome.available.join(', ')}`)
  } else {
    lines.push('No source adapters are registered.')
  }

  return lines.join('\n')
}
