import type { MigrationReport } from './engine.js'

/**
 * The report, for a person.
 *
 * The first line says whether anything was written, because that is the question a
 * reader has before any other, and the skipped list carries its reasons so that
 * "nothing happened to my file" is answerable without reading source.
 */
export function renderMigration(report: MigrationReport): string {
  const lines: string[] = []

  lines.push('Navirox migration')
  lines.push(
    report.dryRun
      ? '  dry run: nothing was written. Add --write to perform it.'
      : '  performed: the files below were written.',
  )
  lines.push('')
  lines.push(`Would move (${report.files.length})`)

  if (report.files.length === 0) {
    lines.push('  nothing')
  } else {
    for (const file of report.files) {
      lines.push(`  ${file.from}`)
      lines.push(
        file.rule === undefined
          ? `      to ${file.to} by ${file.transform}`
          : `      to ${file.to} by ${file.transform} (rule ${file.rule})`,
      )
    }
  }

  lines.push('')
  lines.push(`Unresolved imports (${report.unresolved.length})`)

  if (report.unresolved.length === 0) {
    lines.push('  nothing')
  } else {
    for (const entry of report.unresolved) {
      lines.push(`  ${entry.file}`)
      lines.push(`      ${entry.specifier}: ${entry.reason}`)
    }
  }

  lines.push('')
  lines.push(`Not moved (${report.skipped.length})`)

  const groups = new Map<string, number>()

  for (const entry of report.skipped) {
    groups.set(entry.reason, (groups.get(entry.reason) ?? 0) + 1)
  }

  for (const [reason, count] of [...groups.entries()].sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
  )) {
    lines.push(`  ${String(count).padStart(4)}  ${reason}`)
  }

  return lines.join('\n')
}

export function migrationToJson(report: MigrationReport): string {
  return JSON.stringify(report, null, 2)
}
