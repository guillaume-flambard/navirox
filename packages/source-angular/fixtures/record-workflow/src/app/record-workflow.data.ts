/**
 * The record workflow's data and rules, written for this project.
 *
 * Nothing here comes from the benchmarked application: the records are invented,
 * the asset beside this file was drawn for the fixture, and there is no network
 * call anywhere, so the workflow needs no account, no credential and no service.
 * The values are fixed on purpose so a test can assert them.
 */

export interface RecordWorkflowRecord {
  readonly id: number
  readonly title: string
  readonly status: string
  readonly field: string
}

export const RECORD_WORKFLOW_RECORDS: readonly RecordWorkflowRecord[] = [
  { id: 1, title: 'North pump station', status: 'new', field: 'Filter change due' },
  { id: 2, title: 'River meter', status: 'in progress', field: 'Seal replaced' },
]

export const RECORD_WORKFLOW_STATUSES: readonly string[] = ['new', 'in progress', 'done']

export const RECORD_WORKFLOW_FIELD_VALUES: readonly string[] = [
  'Filter change due',
  'Filter replaced',
  'Site secure',
]

export const RECORD_WORKFLOW_ATTACHMENT = {
  name: 'site-photo.svg',
  label: 'Photo attached',
} as const

/**
 * The ordered actions the workflow performs, with the test identifier each one
 * acts on. Declared as data so a test can compare this contract with the
 * workflow record document instead of trusting prose in two places.
 */
export const RECORD_WORKFLOW_ACTIONS = [
  { id: 'open-queue', identifier: 'record-workflow-queue' },
  { id: 'select-record', identifier: 'record-workflow-select' },
  { id: 'edit-field', identifier: 'record-workflow-field' },
  { id: 'cycle-status', identifier: 'record-workflow-status' },
  { id: 'attach-document', identifier: 'record-workflow-attach' },
  { id: 'save-record', identifier: 'record-workflow-save' },
] as const

/**
 * The identifiers every state of the workflow renders, so a later stage can
 * assert the screen actually rendered rather than only that the actions ran.
 */
export const RECORD_WORKFLOW_IDENTIFIERS: readonly string[] = [
  'record-workflow-screen',
  'record-workflow-queue',
  'record-workflow-row',
  'record-workflow-select',
]

export const RECORD_WORKFLOW_DESKTOP_ONLY: readonly string[] = [
  'Administration and configuration surfaces',
  'Bulk editing across records',
  'Reporting and export',
  'Accounts, roles and permissions',
]

/**
 * The Angular journey has no target path yet, so these actions are declared for
 * the companion stage and are not run anywhere. Saying so is the point: a record
 * must not claim a scenario that was never executed.
 */
export const RECORD_WORKFLOW_EXECUTION = {
  executable: false,
  reason:
    'The Angular journey has no target path yet, so the actions are declared for the companion stage and are not executed by any run.',
} as const

/** The value after the current one, wrapping at the end of the list. */
export function nextIn(values: readonly string[], current: string): string {
  const index = values.indexOf(current)

  return values[(index + 1) % values.length] ?? ''
}

/** Whether a save may proceed. A record without a field value cannot be saved. */
export function canSave(field: string): boolean {
  return field.trim().length > 0
}

/** What the save reports, so the failure state is reachable and observable. */
export function saveOutcome(field: string): 'saved' | 'error' {
  return canSave(field) ? 'saved' : 'error'
}
