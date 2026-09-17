import { exitCodeFor, type IDoctorReport, type TSectionId, type TStatus } from './doctor.js'

/**
 * Turning a report into what a person reads, and into what CI reads.
 *
 * The two are separate functions on purpose: the JSON is a contract that tools
 * parse and the text is not, so the text is free to be shaped for a terminal
 * while the JSON keeps one flat shape that a snapshot test can hold still.
 */

const MARKS: Record<TStatus, string> = { ok: '✓', warn: '!', fail: '✗', unknown: '?' }

const TITLES: Record<TSectionId, string> = {
  environment: 'Environment',
  runtime: 'Runtime',
  compatibility: 'Compatibility',
}

export function renderReport(report: IDoctorReport): string {
  const lines = [`Navirox doctor, for ${report.platform} builds`, report.appDirectory, '']

  for (const section of report.sections) {
    lines.push(TITLES[section.id])

    for (const check of section.checks) {
      const detail = check.detail === '' ? '' : ` ${check.detail}`
      lines.push(`  ${MARKS[check.status]} ${check.label}${detail}`)

      if (check.status !== 'ok' && check.remedy !== '') {
        lines.push(`      ${check.remedy}`)
      }
    }

    lines.push('')
  }

  lines.push(summarise(report))
  return `${lines.join('\n')}\n`
}

export function summarise(report: IDoctorReport): string {
  const { fail, warn, unknown } = report.counts

  if (fail === 0 && warn === 0 && unknown === 0) {
    return 'Everything this command can check is in place.'
  }

  const parts: string[] = []
  if (fail > 0) {
    parts.push(plural(fail, 'problem'))
  }
  if (warn > 0) {
    parts.push(plural(warn, 'warning'))
  }
  if (unknown > 0) {
    parts.push(plural(unknown, 'unknown'))
  }

  return `${parts.join(', ')}.`
}

export function reportToJson(report: IDoctorReport): string {
  return `${JSON.stringify(
    {
      app: report.appDirectory,
      platform: report.platform,
      exitCode: exitCodeFor(report),
      counts: report.counts,
      sections: report.sections.map((section) => ({
        id: section.id,
        checks: section.checks.map((check) => ({
          id: check.id,
          label: check.label,
          status: check.status,
          detail: check.detail,
          remedy: check.remedy,
        })),
      })),
    },
    null,
    2,
  )}\n`
}

function plural(count: number, noun: string): string {
  return count === 1 ? `1 ${noun}` : `${count} ${noun}s`
}
