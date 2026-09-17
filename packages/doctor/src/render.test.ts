import { describe, expect, it } from 'vitest'
import { runDoctor, type IDoctorDeps, type IDoctorReport } from './doctor.js'
import { renderReport, reportToJson, summarise } from './render.js'

/** A Mac missing every tool but Node, so there is something to render and fix. */
function bareDeps(): IDoctorDeps {
  return {
    env: {},
    nodeVersion: 'v24.21.0',
    probe: { find: () => undefined, exists: () => false },
    command: { run: () => ({ status: 127, stdout: '', stderr: 'not found' }) },
    exists: () => false,
    readFile: () => {
      throw new Error('ENOENT')
    },
  }
}

function report(): IDoctorReport {
  return runDoctor(
    { directory: '/app' },
    {
      ...bareDeps(),
      readFile: (path) =>
        path === '/app/package.json' ? JSON.stringify({ name: 'demo' }) : JSON.stringify({}),
    },
  )
}

describe('renderReport', () => {
  it('says what it checked, what it found, and what to do about it', () => {
    const text = renderReport(report())

    expect(text).toContain('Navirox doctor, for ios builds')
    expect(text).toContain('/app')
    expect(text).toContain('Environment')
    expect(text).toContain('Compatibility')
    expect(text).toContain('✗ watchman')
    expect(text).toContain('brew install watchman')
    expect(text).toMatch(/\n {6}\S/)
  })

  it('marks an unknown as a question rather than as a failure', () => {
    const text = renderReport(report())

    expect(text).toContain('? The compatibility registry')
  })
})

describe('summarise', () => {
  it('counts problems and warnings separately, and never prints a zero', () => {
    const text = summarise(report())

    expect(text).toContain('problems')
    expect(text).toContain('unknowns')
    expect(text).not.toContain('0 ')
  })

  it('says so when there is nothing to report', () => {
    const clean: IDoctorReport = {
      appDirectory: '/app',
      platform: 'ios',
      sections: [{ id: 'runtime', checks: [] }],
      counts: { ok: 1, warn: 0, fail: 0, unknown: 0 },
    }

    expect(summarise(clean)).toBe('Everything this command can check is in place.')
  })
})

describe('reportToJson', () => {
  it('keeps one flat shape CI can rely on', () => {
    const parsed = JSON.parse(reportToJson(report())) as Record<string, unknown>

    expect(Object.keys(parsed).sort()).toEqual([
      'app',
      'counts',
      'exitCode',
      'platform',
      'sections',
    ])
    expect(parsed.exitCode).toBe(2)
    expect(Object.keys(parsed.counts as object).sort()).toEqual(['fail', 'ok', 'unknown', 'warn'])

    const sections = parsed.sections as { id: string; checks: Record<string, unknown>[] }[]
    expect(sections.map((section) => section.id)).toEqual([
      'environment',
      'runtime',
      'compatibility',
    ])

    for (const check of sections.flatMap((section) => section.checks)) {
      expect(Object.keys(check).sort()).toEqual(['detail', 'id', 'label', 'remedy', 'status'])
    }
  })
})
