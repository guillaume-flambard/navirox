import { describe, expect, it } from 'vitest'
import type { VisualScenario } from './scenario.js'
import { validateScenario } from './scenario.js'

function validScenario(): VisualScenario {
  return {
    name: 'records-list',
    route: '/records',
    dataStatus: 'ready',
    viewportWidth: 390,
    viewportHeight: 844,
    device: 'web-chrome-390x844',
    colourScheme: 'light',
    fontScale: 1,
    reducedMotion: false,
    actions: [],
    captures: [{ key: 'rest', moment: 'rest' }],
    masks: [],
  }
}

function pathsOf(value: unknown): string[] {
  return validateScenario(value).map((issue) => issue.path)
}

describe('validateScenario', () => {
  it('accepts a complete records scenario', () => {
    expect(validateScenario(validScenario())).toEqual([])
  })

  it('rejects a non-object scenario', () => {
    expect(pathsOf(null)).toEqual([''])
    expect(pathsOf([])).toEqual([''])
    expect(pathsOf('records-list')).toEqual([''])
  })

  it('rejects a capture without a known moment', () => {
    const scenario = validScenario()
    scenario.captures = [{ key: 'rest', moment: undefined as never }]
    expect(pathsOf(scenario)).toContain('captures[0].moment')

    const unknown = validScenario()
    unknown.captures = [{ key: 'rest', moment: 'hover' as never }]
    expect(pathsOf(unknown)).toContain('captures[0].moment')
  })

  it('rejects a mask that names an undeclared capture key', () => {
    const scenario = validScenario()
    scenario.masks = [{ captures: ['settled'], x: 0, y: 0, width: 10, height: 10, reason: 'clock' }]
    expect(pathsOf(scenario)).toContain('masks[0].captures[0]')
  })

  it('rejects duplicate capture keys', () => {
    const scenario = validScenario()
    scenario.captures = [
      { key: 'rest', moment: 'rest' },
      { key: 'rest', moment: 'settled' },
    ]
    expect(pathsOf(scenario)).toContain('captures[1].key')
  })

  it('rejects invalid viewport, device and presentation fields', () => {
    const scenario = validScenario()
    scenario.viewportWidth = 0
    scenario.viewportHeight = -1
    scenario.device = ''
    scenario.colourScheme = 'sepia' as never
    scenario.fontScale = 0
    scenario.reducedMotion = 'no' as never
    const paths = pathsOf(scenario)
    expect(paths).toContain('viewportWidth')
    expect(paths).toContain('viewportHeight')
    expect(paths).toContain('device')
    expect(paths).toContain('colourScheme')
    expect(paths).toContain('fontScale')
    expect(paths).toContain('reducedMotion')
  })

  it('rejects an invalid data status and route', () => {
    const scenario = validScenario()
    scenario.route = ''
    scenario.dataStatus = 'archived' as never
    const paths = pathsOf(scenario)
    expect(paths).toContain('route')
    expect(paths).toContain('dataStatus')
  })

  it('rejects actions without a stable test identifier', () => {
    const scenario = validScenario()
    scenario.actions = [{ press: '' }]
    expect(pathsOf(scenario)).toContain('actions[0].press')
  })

  it('rejects masks without captures, dimensions or reason', () => {
    const scenario = validScenario()
    scenario.masks = [{ captures: [], x: -1, y: 0, width: 10, height: 10, reason: '' }]
    const paths = pathsOf(scenario)
    expect(paths).toContain('masks[0].captures')
    expect(paths).toContain('masks[0].x')
    expect(paths).toContain('masks[0].reason')
  })

  it('accepts an interruptible motion scenario with the five moments in order', () => {
    const scenario = validScenario()
    scenario.motion = { interaction: 'select a record', interruptible: true }
    scenario.captures = [
      { key: 'rest', moment: 'rest' },
      { key: 'first', moment: 'first-meaningful' },
      { key: 'mid', moment: 'midpoint' },
      { key: 'settled', moment: 'settled' },
      { key: 'interrupted', moment: 'interrupted' },
    ]
    expect(validateScenario(scenario)).toEqual([])
  })

  it('accepts a non-interruptible motion scenario without the interrupted moment', () => {
    const scenario = validScenario()
    scenario.motion = { interaction: 'select a record', interruptible: false }
    scenario.captures = [
      { key: 'rest', moment: 'rest' },
      { key: 'first', moment: 'first-meaningful' },
      { key: 'mid', moment: 'midpoint' },
      { key: 'settled', moment: 'settled' },
    ]
    expect(validateScenario(scenario)).toEqual([])
  })

  it('rejects the interrupted moment without a motion declaration', () => {
    const scenario = validScenario()
    scenario.captures = [
      { key: 'rest', moment: 'rest' },
      { key: 'interrupted', moment: 'interrupted' },
    ]
    expect(pathsOf(scenario)).toContain('captures')
  })

  it('rejects motion moments that are out of order or incomplete', () => {
    const outOfOrder = validScenario()
    outOfOrder.motion = { interaction: 'select a record', interruptible: true }
    outOfOrder.captures = [
      { key: 'rest', moment: 'rest' },
      { key: 'mid', moment: 'midpoint' },
      { key: 'first', moment: 'first-meaningful' },
      { key: 'settled', moment: 'settled' },
      { key: 'interrupted', moment: 'interrupted' },
    ]
    expect(pathsOf(outOfOrder)).toContain('captures')

    const incomplete = validScenario()
    incomplete.motion = { interaction: 'select a record', interruptible: true }
    incomplete.captures = [{ key: 'rest', moment: 'rest' }]
    expect(pathsOf(incomplete)).toContain('captures')
  })

  it('rejects a motion declaration without an interaction or interruptible flag', () => {
    const noInteraction = validScenario()
    noInteraction.motion = { interaction: '', interruptible: true }
    noInteraction.captures = [
      { key: 'rest', moment: 'rest' },
      { key: 'first', moment: 'first-meaningful' },
      { key: 'mid', moment: 'midpoint' },
      { key: 'settled', moment: 'settled' },
      { key: 'interrupted', moment: 'interrupted' },
    ]
    expect(pathsOf(noInteraction)).toContain('motion.interaction')

    const noFlag = validScenario()
    noFlag.motion = { interaction: 'select a record' } as never
    expect(pathsOf(noFlag)).toContain('motion.interruptible')
  })

  it('rejects an action with a negative or fractional index', () => {
    const scenario = validScenario()
    scenario.actions = [{ press: 'record-select', nth: -1 }]
    expect(pathsOf(scenario)).toContain('actions[0].nth')

    const fractional = validScenario()
    fractional.actions = [{ press: 'record-select', nth: 0.5 }]
    expect(pathsOf(fractional)).toContain('actions[0].nth')
  })

  it('rejects a capture action without a stable test identifier', () => {
    const scenario = validScenario()
    scenario.captures = [{ key: 'rest', moment: 'rest', actions: [{ press: '' }] }]
    expect(pathsOf(scenario)).toContain('captures[0].actions[0].press')
  })

  it('keeps the measurement-only behaviour when no tolerance is declared', () => {
    expect(validateScenario(validScenario())).toEqual([])
  })

  it('accepts a declared cross-platform tolerance', () => {
    const scenario = validScenario()
    scenario.tolerance = { gridSize: 0.05, identifiers: ['records-screen', 'records-list'] }
    expect(validateScenario(scenario)).toEqual([])
  })

  it('rejects a grid tolerance outside the range a relative difference can have', () => {
    for (const gridSize of [-0.1, 1, 2]) {
      const scenario = validScenario()
      scenario.tolerance = { gridSize, identifiers: ['records-screen'] }
      expect(pathsOf(scenario)).toContain('tolerance.gridSize')
    }
  })

  it('rejects a tolerance with no identifier list', () => {
    const missing = validScenario()
    missing.tolerance = { gridSize: 0.05 } as never
    expect(pathsOf(missing)).toContain('tolerance.identifiers')

    const empty = validScenario()
    empty.tolerance = { gridSize: 0.05, identifiers: [] }
    expect(pathsOf(empty)).toContain('tolerance.identifiers')
  })

  it('rejects an identifier that is not a name', () => {
    const scenario = validScenario()
    scenario.tolerance = { gridSize: 0.05, identifiers: ['records-screen', ''] }
    expect(pathsOf(scenario)).toContain('tolerance.identifiers[1]')
  })

  it('rejects a tolerance that is not an object', () => {
    const scenario = validScenario()
    scenario.tolerance = 'five percent' as never
    expect(pathsOf(scenario)).toContain('tolerance')
  })
})
