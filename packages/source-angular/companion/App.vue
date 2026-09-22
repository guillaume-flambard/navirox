<!--
  The Angular proof companion's screen.

  This file is hand-written native work, and the assembly records it as manual.
  The Angular journey has no target compiler, so nothing here is generated from
  Angular templates: the source of truth for the workflow's behaviour is the
  shared module the planner approved, which the assembly copies beside this file
  and which this screen imports and calls. Every ordered action in the workflow
  record has an identifier here, so a bundle check can see the screen the
  companion really shows.
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  RECORD_WORKFLOW_ATTACHMENT,
  RECORD_WORKFLOW_RECORDS,
  RECORD_WORKFLOW_STATUSES,
  nextIn,
  saveOutcome,
  type RecordWorkflowRecord,
} from './record-workflow.data'

const records = ref<readonly RecordWorkflowRecord[]>(RECORD_WORKFLOW_RECORDS)
const selected = ref<RecordWorkflowRecord | undefined>(undefined)
const field = ref('')
const status = ref('')
const attachment = ref('')
const saveState = ref<'idle' | 'saved' | 'error'>('idle')

const attachmentLabel = computed(() =>
  attachment.value.length > 0 ? RECORD_WORKFLOW_ATTACHMENT.label : 'No attachment',
)

function select(record: RecordWorkflowRecord): void {
  selected.value = record
  field.value = record.field
  status.value = record.status
  attachment.value = ''
  saveState.value = 'idle'
}

function cycleStatus(): void {
  status.value = nextIn(RECORD_WORKFLOW_STATUSES, status.value)
}

function attach(): void {
  attachment.value = RECORD_WORKFLOW_ATTACHMENT.name
}

function save(): void {
  saveState.value = saveOutcome(field.value)
}
</script>

<template>
  <view class="screen" testID="record-workflow-screen">
    <text class="title">Record workflow</text>

    <view class="queue" testID="record-workflow-queue">
      <view v-for="record in records" :key="record.id" class="row" testID="record-workflow-row">
        <pressable class="row-button" testID="record-workflow-select" @press="select(record)">
          <text class="row-label">{{ record.title }}</text>
        </pressable>
      </view>
    </view>

    <view v-if="selected !== undefined" class="detail" testID="record-workflow-detail">
      <text class="field" testID="record-workflow-field">Field: {{ field }}</text>

      <pressable class="action" testID="record-workflow-status" @press="cycleStatus()">
        <text class="action-label">Status: {{ status }}</text>
      </pressable>

      <pressable class="action" testID="record-workflow-attach" @press="attach()">
        <text class="action-label">Attach a document</text>
      </pressable>

      <text class="attachment" testID="record-workflow-attachment">{{ attachmentLabel }}</text>

      <pressable class="save" testID="record-workflow-save" @press="save()">
        <text class="save-label">Save the record</text>
      </pressable>

      <text v-if="saveState === 'saved'" class="saved" testID="record-workflow-saved">Saved</text>
      <text v-else-if="saveState === 'error'" class="error" testID="record-workflow-error">
        Could not save: a field value is required.
      </text>
    </view>
  </view>
</template>

<style scoped>
.screen {
  flex: 1;
  padding: 20;
  background-color: #0b1020;
}

.title {
  font-size: 22;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12;
}

.queue {
  margin-bottom: 12;
}

.row {
  margin-bottom: 8;
}

.row-button {
  padding: 12;
  border-radius: 10;
  background-color: #151b2e;
}

.row-label {
  font-size: 15;
  color: #dfe5f2;
}

.detail {
  padding: 14;
  border-radius: 12;
  background-color: #151b2e;
}

.field {
  font-size: 14;
  color: #dfe5f2;
  margin-bottom: 8;
}

.action {
  padding: 10;
  border-radius: 8;
  border-width: 1;
  border-color: #38425e;
  margin-bottom: 8;
}

.action-label {
  font-size: 13;
  color: #aab4cc;
}

.attachment {
  font-size: 13;
  color: #7c8db5;
  margin-bottom: 10;
}

.save {
  padding: 10;
  border-radius: 8;
  background-color: #2f6bff;
}

.save-label {
  font-size: 14;
  color: #ffffff;
}

.saved {
  font-size: 13;
  color: #7ee0a8;
  margin-top: 8;
}

.error {
  font-size: 13;
  color: #ff9b9b;
  margin-top: 8;
}
</style>
