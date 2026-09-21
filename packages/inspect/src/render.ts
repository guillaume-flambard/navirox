import type { UnitKind, UnitNode } from '@memolabs-apps/graph'
import type { InspectOutcome, InspectReport } from './types.js'

/**
 * Turning a report into what a person reads.
 *
 * The order is the order of the questions a reader has: which project was read,
 * by what, what is in it, what could not be established, and what to do next.
 * "What could not be established" is a section rather than a footnote, because a
 * report that only lists what it found is a report that hides its own limits.
 */

function nextStep(command: 'analyze' | 'inspect'): string {
  return `Run \`navirox ${command} --json\` for the full graph.`
}

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

interface AdapterObservation {
  readonly unit: string
  readonly key: string
  readonly state?: string
  readonly reason: string
}

/**
 * What an adapter noticed about a unit, in the adapter's own words.
 *
 * This renderer interprets none of it: it prints the entry an adapter attached to
 * a unit's metadata and the reason that adapter gave. An entry is shown only when
 * it carries a reason string, because an observation nobody can justify is not
 * worth printing. An observation is a statement about the source, never a
 * statement that a unit can be moved as it is.
 */
function adapterObservations(units: readonly UnitNode[]): AdapterObservation[] {
  const observations: AdapterObservation[] = []

  for (const unit of units) {
    const metadata = unit.metadata

    if (metadata === undefined) {
      continue
    }

    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        continue
      }

      const entry = value as Record<string, unknown>
      const reason = entry.reason

      if (typeof reason !== 'string') {
        continue
      }

      observations.push({
        unit: unit.source.file,
        key,
        reason,
        ...(typeof entry.state === 'string' ? { state: entry.state } : {}),
      })
    }
  }

  return observations.sort((left, right) =>
    `${left.unit}:${left.key}`.localeCompare(`${right.unit}:${right.key}`),
  )
}

export function renderReport(
  report: InspectReport,
  command: 'analyze' | 'inspect' = 'inspect',
): string {
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

  const observations = adapterObservations(graph.units)

  if (observations.length > 0) {
    lines.push('')
    lines.push(`Observations (${observations.length})`)
    for (const observation of observations) {
      lines.push(`  ${observation.state ?? 'observed'} ${observation.unit} (${observation.key})`)
      lines.push(`          ${observation.reason}`)
    }
  }

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
  lines.push(`  ${nextStep(command)}`)

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
