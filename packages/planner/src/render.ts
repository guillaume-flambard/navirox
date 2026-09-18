import type { MigrationClass } from './classes.js'
import { MIGRATION_CLASSES } from './classes.js'
import type { MigrationPlan } from './plan.js'

/**
 * The plan, rendered for a person.
 *
 * The order is the order of the questions: what was decided, over how much, what
 * could not be decided, and what the classes mean. The unknown count is a section
 * rather than a footnote, because a plan that hides its own extent is worse than
 * no plan.
 */

const MEANING: Record<MigrationClass, string> = {
  shared: 'moves unchanged',
  portable: 'moves with its shape intact',
  adaptable: 'keeps its behaviour, changes its platform call',
  'native-replacement': 'its role is understood, its implementation is rewritten',
  'web-fallback': 'kept as web for now, not the target',
  manual: 'a person has to decide',
  unknown: 'Navirox has no answer yet',
}

export function renderPlan(plan: MigrationPlan): string {
  const lines: string[] = []

  lines.push('Navirox migration plan')
  lines.push(`  adapter  ${plan.source.adapterId} (${plan.source.displayName})`)
  lines.push('')

  lines.push('Decided')
  for (const classification of MIGRATION_CLASSES) {
    const count = plan.summary[classification]

    lines.push(
      `  ${classification.padEnd(19)} ${String(count).padStart(4)}  ${MEANING[classification]}`,
    )
  }

  lines.push('')
  lines.push(`Not decided (${plan.unknowns.length})`)
  if (plan.unknowns.length === 0) {
    lines.push('  nothing was left unknown')
  } else {
    // Grouped by reason rather than listed subject by subject: fourteen
    // dependencies with one explanation is one fact, not fourteen, and a list
    // that repeats itself hides the count that matters.
    const groups = new Map<string, string[]>()

    for (const subject of plan.unknowns) {
      const decision = plan.decisions.find((candidate) => candidate.subject === subject)
      const reason = decision?.reasons[0]?.message ?? 'no reason recorded'
      const subjects = groups.get(reason) ?? []

      subjects.push(subject)
      groups.set(reason, subjects)
    }

    for (const [reason, subjects] of [...groups.entries()].sort(
      (left, right) => right[1].length - left[1].length || left[0].localeCompare(right[0]),
    )) {
      lines.push(`  ${String(subjects.length).padStart(4)}  ${reason}`)
      lines.push(`        for example ${subjects[0] ?? ''}`)
    }
  }

  lines.push('')
  lines.push('Next')
  lines.push('  Run `navirox plan --json` for the decisions and their evidence.')

  return lines.join('\n')
}

/** The machine form: one JSON document, no prose. */
export function planToJson(plan: MigrationPlan): string {
  return JSON.stringify(plan, null, 2)
}
