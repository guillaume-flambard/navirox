import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createProjectFiles } from '@memolabs-apps/source'
import { describe, expect, it } from 'vitest'
import {
  RECORD_WORKFLOW_ACTIONS,
  RECORD_WORKFLOW_ATTACHMENT,
  RECORD_WORKFLOW_DESKTOP_ONLY,
  RECORD_WORKFLOW_EXECUTION,
  RECORD_WORKFLOW_FIELD_VALUES,
  RECORD_WORKFLOW_IDENTIFIERS,
  RECORD_WORKFLOW_RECORDS,
  RECORD_WORKFLOW_STATUSES,
} from '../fixtures/record-workflow/src/app/record-workflow.data.js'
import { createAngularAdapter } from './index.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const FIXTURE = join(HERE, '..', 'fixtures', 'record-workflow')
const RECORD = join(
  HERE,
  '..',
  '..',
  '..',
  'docs',
  'evidence',
  'workflow-suitecrm-record-workflow.md',
)
const SOURCE_FILES = [
  join(FIXTURE, 'package.json'),
  join(FIXTURE, 'src', 'app', 'record-workflow.data.ts'),
  join(FIXTURE, 'src', 'app', 'record-workflow.service.ts'),
  join(FIXTURE, 'src', 'app', 'record-workflow.component.ts'),
  join(FIXTURE, 'src', 'app', 'site-photo.svg'),
]

const adapter = createAngularAdapter()

async function inspectFixture() {
  return adapter.inspect(createProjectFiles(FIXTURE))
}

function readinessOf(
  inspection: Awaited<ReturnType<typeof inspectFixture>>,
  file: string,
): Record<string, unknown> | undefined {
  const unit = inspection.units.find((candidate) => candidate.source.file === file)

  return unit?.metadata?.mobileReadiness as Record<string, unknown> | undefined
}

describe('the record workflow fixture', () => {
  it('is read as a workflow component and a state service', async () => {
    const inspection = await inspectFixture()
    const kinds = inspection.units.map((unit) => unit.kind).sort()

    expect(kinds).toEqual(['component', 'state-module', 'utility'])

    expect(readinessOf(inspection, 'src/app/record-workflow.component.ts')).toMatchObject({
      state: 'candidate',
      rule: 'attachment-signal',
    })

    const service = inspection.units.find(
      (unit) => unit.source.file === 'src/app/record-workflow.service.ts',
    )

    expect(service?.kind).toBe('state-module')
  })

  it('carries only invented data and its own asset', () => {
    expect(RECORD_WORKFLOW_RECORDS).toEqual([
      { id: 1, title: 'North pump station', status: 'new', field: 'Filter change due' },
      { id: 2, title: 'River meter', status: 'in progress', field: 'Seal replaced' },
    ])
    expect(RECORD_WORKFLOW_STATUSES).toEqual(['new', 'in progress', 'done'])
    expect(RECORD_WORKFLOW_FIELD_VALUES).toEqual([
      'Filter change due',
      'Filter replaced',
      'Site secure',
    ])
    expect(RECORD_WORKFLOW_ATTACHMENT).toEqual({
      name: 'site-photo.svg',
      label: 'Photo attached',
    })
    expect(existsSync(join(FIXTURE, 'src', 'app', 'site-photo.svg'))).toBe(true)
  })

  it('declares the acceptance actions and states they are not yet executable', () => {
    expect(RECORD_WORKFLOW_ACTIONS.map((action) => action.id)).toEqual([
      'open-queue',
      'select-record',
      'edit-field',
      'cycle-status',
      'attach-document',
      'save-record',
    ])
    expect(RECORD_WORKFLOW_IDENTIFIERS).toEqual([
      'record-workflow-screen',
      'record-workflow-queue',
      'record-workflow-row',
      'record-workflow-select',
    ])
    expect(RECORD_WORKFLOW_DESKTOP_ONLY).toEqual([
      'Administration and configuration surfaces',
      'Bulk editing across records',
      'Reporting and export',
      'Accounts, roles and permissions',
    ])
    expect(RECORD_WORKFLOW_EXECUTION.executable).toBe(true)
    expect(RECORD_WORKFLOW_EXECUTION.reason.length).toBeGreaterThan(0)
  })

  it('references no external asset or service', () => {
    for (const file of SOURCE_FILES) {
      const text = readFileSync(file, 'utf8')

      expect(text).not.toContain('src="http')
      expect(text).not.toContain('url(http')
      expect(text).not.toContain('fetch(')
      expect(text).not.toContain('XMLHttpRequest')
    }
  })

  it('matches the workflow record it belongs to', () => {
    const record = readFileSync(RECORD, 'utf8')

    for (const action of RECORD_WORKFLOW_ACTIONS) {
      expect(record).toContain(action.identifier)
    }

    for (const identifier of RECORD_WORKFLOW_IDENTIFIERS) {
      expect(record).toContain(identifier)
    }

    expect(record).toContain('2cd77380bc838b8bd6c80f9fbe25855d73ef860c')
    expect(record).toContain('angular-remote-configuration')
    expect(record).toContain('unvalidated hypothesis')
  })
})
