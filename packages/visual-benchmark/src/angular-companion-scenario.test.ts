import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  ANGULAR_COMPANION_IDENTIFIERS,
  angularCompanionScenario,
} from './scenarios/angular-companion.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const RECORD = join(
  HERE,
  '..',
  '..',
  '..',
  'docs',
  'evidence',
  'workflow-suitecrm-record-workflow.md',
)
const MOMENTS = ['rest', 'first-meaningful', 'midpoint', 'settled', 'interrupted']

describe('the Angular companion device scenario', () => {
  const record = readFileSync(RECORD, 'utf8')

  it('drives only identifiers the workflow record declares', () => {
    const presses = angularCompanionScenario.captures.flatMap((capture) =>
      (capture.actions ?? []).map((action) => action.press),
    )

    expect(presses.length).toBeGreaterThan(0)

    for (const press of presses) {
      expect(record).toContain(press)
    }
  })

  it('captures the five moments in order', () => {
    expect(angularCompanionScenario.captures.map((capture) => capture.moment)).toEqual(MOMENTS)
  })

  it('names the identifiers every state renders', () => {
    expect([...ANGULAR_COMPANION_IDENTIFIERS]).toEqual([
      'record-workflow-screen',
      'record-workflow-queue',
      'record-workflow-row',
      'record-workflow-select',
    ])

    for (const identifier of ANGULAR_COMPANION_IDENTIFIERS) {
      expect(record).toContain(identifier)
    }
  })

  it('keeps the first capture free of actions', () => {
    expect(angularCompanionScenario.captures[0]?.actions ?? []).toEqual([])
  })
})
