import { describe, expect, it } from 'vitest'
import { evaluateTolerance, type ToleranceRun } from './tolerance.js'

const GRID_TOLERANCE = { gridSize: 0.05, identifiers: ['records-screen', 'records-list'] }

function passingRun(): ToleranceRun {
  return {
    scenario: 'records-list',
    tolerance: GRID_TOLERANCE,
    platforms: ['ios', 'android'],
    captures: [
      {
        key: 'rest',
        produced: ['web', 'ios', 'android'],
        grid: { web: { width: 118, height: 256 }, device: { width: 115, height: 256 } },
      },
    ],
    identifiers: [
      { name: 'records-screen', asserted: ['web', 'ios', 'android'] },
      { name: 'records-list', asserted: ['web', 'ios', 'android'] },
    ],
  }
}

describe('evaluateTolerance', () => {
  it('passes when every declared check holds', () => {
    const verdict = evaluateTolerance(passingRun())

    expect(verdict.verdict).toBe('pass')
    expect(verdict.decidedBy).toBeUndefined()
    expect(verdict.checks.map((check) => check.name)).toEqual(['captures', 'grid', 'identifiers'])
    expect(verdict.checks.every((check) => check.verdict === 'pass')).toBe(true)
    expect(verdict.checks[1]?.detail).toContain('2.54 percent')
  })

  it('fails on a grid difference beyond the declared tolerance', () => {
    const run = passingRun()

    run.captures[0]!.grid = {
      web: { width: 200, height: 256 },
      device: { width: 100, height: 256 },
    }

    const verdict = evaluateTolerance(run)

    expect(verdict.verdict).toBe('fail')
    expect(verdict.decidedBy).toBe('grid')
    expect(verdict.checks.find((check) => check.name === 'grid')?.detail).toContain(
      'outside the declared 5.00 percent',
    )
  })

  it('fails when a declared capture is missing', () => {
    const run = passingRun()

    run.captures[0]!.produced = ['web', 'ios']

    const verdict = evaluateTolerance(run)

    expect(verdict.verdict).toBe('fail')
    expect(verdict.decidedBy).toBe('captures')
    expect(verdict.checks[0]?.detail).toContain('rest.android')
  })

  it('fails when a declared identifier was not asserted', () => {
    const run = passingRun()

    run.identifiers[1]!.asserted = ['web', 'ios']

    const verdict = evaluateTolerance(run)

    expect(verdict.verdict).toBe('fail')
    expect(verdict.decidedBy).toBe('identifiers')
    expect(verdict.checks[2]?.detail).toContain('records-list.android')
  })

  it('evaluates the motion labels only when motion is declared', () => {
    const run = passingRun()

    run.motion = { declared: true, required: ['rest', 'midpoint'], labels: ['rest', 'midpoint'] }

    const passed = evaluateTolerance(run)

    expect(passed.verdict).toBe('pass')
    expect(passed.checks.map((check) => check.name)).toContain('motion')

    run.motion = { declared: true, required: ['rest', 'midpoint'], labels: ['midpoint', 'rest'] }

    const failed = evaluateTolerance(run)

    expect(failed.verdict).toBe('fail')
    expect(failed.decidedBy).toBe('motion')
    expect(failed.checks.find((check) => check.name === 'motion')?.detail).toContain(
      'the scenario requires rest, midpoint',
    )
  })

  it('does not evaluate motion for a scenario that declares none', () => {
    const verdict = evaluateTolerance(passingRun())

    expect(verdict.checks.map((check) => check.name)).not.toContain('motion')
  })
})
