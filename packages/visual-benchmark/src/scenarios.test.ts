import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { validateScenario } from './scenario.js'
import { FIELD_WORKFLOW_IDENTIFIERS, fieldWorkflowScenario } from './scenarios/field-workflow.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const WORKFLOW_RECORD_PATH = join(
  HERE,
  '..',
  '..',
  '..',
  'docs',
  'evidence',
  'workflow-baserow-field-work.md',
)

describe('field workflow acceptance scenario', () => {
  it('validates with no issues', () => {
    expect(validateScenario(fieldWorkflowScenario)).toEqual([])
  })

  it('drives the identifiers the workflow record names', () => {
    const record = readFileSync(WORKFLOW_RECORD_PATH, 'utf8')
    const drives = fieldWorkflowScenario.captures.flatMap((capture) =>
      (capture.actions ?? []).map((action) => action.press),
    )

    expect(drives).toContain('field-select')
    expect(drives).toContain('field-save')
    expect(drives).toContain('field-status-clear')
    expect(fieldWorkflowScenario.tolerance?.identifiers).toEqual([...FIELD_WORKFLOW_IDENTIFIERS])
    expect(record).toContain('scenarios/field-workflow.ts')

    for (const identifier of [...drives, ...FIELD_WORKFLOW_IDENTIFIERS]) {
      expect(record).toContain(identifier)
    }
  })
})
