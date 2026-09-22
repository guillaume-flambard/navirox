import { Injectable, signal } from '@angular/core'
import {
  RECORD_WORKFLOW_RECORDS,
  RECORD_WORKFLOW_STATUSES,
  nextIn,
  saveOutcome,
  type RecordWorkflowRecord,
} from './record-workflow.data'

/**
 * Holds the workflow state for one record at a time. The state lives here rather
 * than in the component so the behaviour can be reasoned about without a view,
 * and it never leaves the device.
 */
@Injectable({ providedIn: 'root' })
export class RecordWorkflowService {
  readonly records = signal<readonly RecordWorkflowRecord[]>(RECORD_WORKFLOW_RECORDS)
  readonly selected = signal<RecordWorkflowRecord | undefined>(undefined)
  readonly field = signal('')
  readonly status = signal('')
  readonly attachment = signal('')
  readonly saveState = signal<'idle' | 'saved' | 'error'>('idle')

  select(record: RecordWorkflowRecord): void {
    this.selected.set(record)
    this.field.set(record.field)
    this.status.set(record.status)
    this.attachment.set('')
    this.saveState.set('idle')
  }

  setField(value: string): void {
    this.field.set(value)
  }

  cycleStatus(): void {
    this.status.update((current) => nextIn(RECORD_WORKFLOW_STATUSES, current))
  }

  attach(name: string): void {
    this.attachment.set(name)
  }

  save(): void {
    this.saveState.set(saveOutcome(this.field()))
  }
}
