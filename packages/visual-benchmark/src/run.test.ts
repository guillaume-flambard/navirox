import { existsSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CaptureUnavailableError } from './drivers.js'
import type { CaptureDriver } from './run.js'
import { ScenarioRunError, runScenario } from './run.js'
import { validateScenario } from './scenario.js'
import type { VisualScenario } from './scenario.js'

function recordsScenario(): VisualScenario {
  const scenario: VisualScenario = {
    name: 'records-list',
    route: '/records',
    dataStatus: 'ready',
    viewportWidth: 390,
    viewportHeight: 844,
    device: 'test-harness',
    colourScheme: 'light',
    fontScale: 1,
    reducedMotion: false,
    actions: [],
    captures: [{ key: 'rest', moment: 'rest' }],
    masks: [],
  }
  expect(validateScenario(scenario)).toEqual([])
  return scenario
}

function writingDriver(suffix: string): CaptureDriver {
  return (_scenario, capture, outPath) => {
    writeFileSync(outPath, `${capture.key}-${suffix}`)
  }
}

function freshDir(name: string): string {
  return join(tmpdir(), `visual-benchmark-${name}-${process.pid}`)
}

describe('runScenario', () => {
  it('writes every capture to a fresh directory', () => {
    const dir = freshDir('complete')
    const report = runScenario(
      recordsScenario(),
      {
        web: writingDriver('web'),
        native: { ios: writingDriver('ios'), android: writingDriver('android') },
      },
      dir,
    )
    expect(report.outcomes).toHaveLength(1)
    expect(report.outcomes[0].unavailable).toEqual([])
    expect(existsSync(join(dir, 'rest.web.png'))).toBe(true)
    expect(existsSync(join(dir, 'rest.ios.png'))).toBe(true)
    expect(existsSync(join(dir, 'rest.android.png'))).toBe(true)
  })

  it('throws a missing capture when the web driver writes nothing', () => {
    const silent: CaptureDriver = () => {}
    expect(() =>
      runScenario(
        recordsScenario(),
        { web: silent, native: { ios: writingDriver('ios'), android: writingDriver('android') } },
        freshDir('web-missing'),
      ),
    ).toThrow(/rest\.web/)
  })

  it('records native absences as results and throws with the report attached', () => {
    const unavailable: CaptureDriver = (_scenario, capture) => {
      throw new CaptureUnavailableError(capture.key, 'no device pipeline')
    }
    let caught: unknown
    try {
      runScenario(
        recordsScenario(),
        { web: writingDriver('web'), native: { ios: unavailable, android: unavailable } },
        freshDir('native-absent'),
      )
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(ScenarioRunError)
    const failure = caught as ScenarioRunError
    expect(failure.missing).toEqual(['rest.ios', 'rest.android'])
    expect(failure.report.outcomes[0].unavailable).toHaveLength(2)
    expect(failure.report.outcomes[0].web).toContain('rest.web.png')
  })

  it('records the motion labels in the order the scenario declares them', () => {
    const motionScenario: VisualScenario = {
      ...recordsScenario(),
      name: 'records-motion',
      captures: [
        { key: 'rest', moment: 'rest' },
        { key: 'first-meaningful', moment: 'first-meaningful' },
        { key: 'midpoint', moment: 'midpoint' },
        { key: 'settled', moment: 'settled' },
        { key: 'interrupted', moment: 'interrupted' },
      ],
      motion: { interaction: 'select a record', interruptible: true },
    }
    expect(validateScenario(motionScenario)).toEqual([])
    const report = runScenario(
      motionScenario,
      {
        web: writingDriver('web'),
        native: { ios: writingDriver('ios'), android: writingDriver('android') },
      },
      freshDir('motion'),
    )
    expect(report.motion).toEqual({
      declared: true,
      interruptible: true,
      interaction: 'select a record',
      labels: ['rest', 'first-meaningful', 'midpoint', 'settled', 'interrupted'],
    })
  })

  it('reports no motion when the scenario declares none', () => {
    const report = runScenario(
      recordsScenario(),
      {
        web: writingDriver('web'),
        native: { ios: writingDriver('ios'), android: writingDriver('android') },
      },
      freshDir('no-motion'),
    )
    expect(report.motion).toEqual({ declared: false, interruptible: false, labels: ['rest'] })
  })
})
