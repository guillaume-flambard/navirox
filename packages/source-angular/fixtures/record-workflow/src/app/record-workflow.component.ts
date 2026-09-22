import { Component, inject } from '@angular/core'
import { NgFor, NgIf } from '@angular/common'
import { RECORD_WORKFLOW_ATTACHMENT } from './record-workflow.data'
import { RecordWorkflowService } from './record-workflow.service'

/**
 * The one workflow this proof contracts: open the queue, select a record, edit
 * one field, move its status, attach a document or a photo and save. Everything
 * happens on the device and nothing leaves it, so the workflow needs no account
 * and no service.
 */
@Component({
  selector: 'app-record-workflow',
  standalone: true,
  imports: [NgFor, NgIf],
  template: `
    <section data-testid="record-workflow-screen">
      <h1>Record workflow</h1>

      <ul data-testid="record-workflow-queue">
        <li *ngFor="let record of workflow.records()" data-testid="record-workflow-row">
          <button data-testid="record-workflow-select" (click)="workflow.select(record)">
            {{ record.title }}
          </button>
        </li>
      </ul>

      <div *ngIf="workflow.selected() !== undefined" data-testid="record-workflow-detail">
        <label>
          Field
          <input
            data-testid="record-workflow-field"
            [value]="workflow.field()"
            (input)="onField($event)"
          />
        </label>

        <button data-testid="record-workflow-status" (click)="workflow.cycleStatus()">
          Status: {{ workflow.status() }}
        </button>

        <label>
          Attachment
          <input data-testid="record-workflow-attach" type="file" (change)="onFile($event)" />
        </label>
        <p data-testid="record-workflow-attachment">{{ attachmentLabel() }}</p>

        <button data-testid="record-workflow-save" (click)="workflow.save()">Save</button>

        <p *ngIf="workflow.saveState() === 'saved'" data-testid="record-workflow-saved">Saved</p>
        <p *ngIf="workflow.saveState() === 'error'" data-testid="record-workflow-error">
          Could not save: a field value is required.
        </p>
      </div>
    </section>
  `,
})
export class RecordWorkflowComponent {
  readonly workflow = inject(RecordWorkflowService)

  attachmentLabel(): string {
    return this.workflow.attachment().length > 0
      ? RECORD_WORKFLOW_ATTACHMENT.label
      : 'No attachment'
  }

  onField(event: Event): void {
    this.workflow.setField((event.target as HTMLInputElement).value)
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement

    this.workflow.attach(input.files?.[0]?.name ?? RECORD_WORKFLOW_ATTACHMENT.name)
  }
}
