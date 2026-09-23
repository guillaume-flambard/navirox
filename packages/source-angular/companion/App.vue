<script setup lang="ts">
import { reactive, ref } from 'vue'
import {
  RECORD_WORKFLOW_ATTACHMENT,
  RECORD_WORKFLOW_RECORDS,
  RECORD_WORKFLOW_STATUSES,
  nextIn,
  saveOutcome,
  type RecordWorkflowRecord,
} from './record-workflow.data'
function attachmentLabel() {
  return workflow.attachment.length > 0 ? RECORD_WORKFLOW_ATTACHMENT.label : 'No attachment'
}
function onField(event: Event) {
  workflow.setField(event.text)
}
function onFile(event: Event) {
  const input = event.target as HTMLInputElement

  workflow.attach(input.files?.[0]?.name ?? RECORD_WORKFLOW_ATTACHMENT.name)
}
const workflow = reactive({
  records: ref(RECORD_WORKFLOW_RECORDS),
  selected: ref(undefined),
  field: ref(''),
  status: ref(''),
  attachment: ref(''),
  saveState: ref('idle'),
  select(record: RecordWorkflowRecord) {
    this.selected = record
    this.field = record.field
    this.status = record.status
    this.attachment = ''
    this.saveState = 'idle'
  },
  setField(value: string) {
    this.field = value
  },
  cycleStatus() {
    this.status = ((current) => nextIn(RECORD_WORKFLOW_STATUSES, current))(this.status)
  },
  attach(name: string) {
    this.attachment = name
  },
  save() {
    this.saveState = saveOutcome(this.field)
  },
})
</script>
<template>
  <view testID="record-workflow-screen"
    ><text>Record workflow</text
    ><view testID="record-workflow-queue"
      ><view v-for="record in workflow.records" testID="record-workflow-row"
        ><pressable testID="record-workflow-select" @press="workflow.select(record)"
          ><text>{{ record.title }}</text></pressable
        ></view
      ></view
    ><view v-if="workflow.selected !== undefined" testID="record-workflow-detail"
      ><text>
        Field
        <text-input
          testID="record-workflow-field"
          :value="workflow.field"
          @value-change="onField($event)"
        ></text-input></text
      ><pressable testID="record-workflow-status" @press="workflow.cycleStatus()"
        ><text>Status: {{ workflow.status }}</text></pressable
      ><text>
        Attachment
        <text-input
          testID="record-workflow-attach"
          type="file"
          @value-change="onFile($event)"
        ></text-input></text
      ><text testID="record-workflow-attachment">{{ attachmentLabel() }}</text
      ><pressable testID="record-workflow-save" @press="workflow.save()"
        ><text>Save</text></pressable
      ><text v-if="workflow.saveState === 'saved'" testID="record-workflow-saved">Saved</text
      ><text v-if="workflow.saveState === 'error'" testID="record-workflow-error">
        Could not save: a field value is required.
      </text></view
    ></view
  >
</template>
