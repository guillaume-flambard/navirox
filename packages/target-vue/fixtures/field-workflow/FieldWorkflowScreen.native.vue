<script setup lang="ts">

import { computed, ref } from 'vue'
import {
  FIELD_ATTACHMENT,
  FIELD_NOTES,
  FIELD_RECORDS,
  FIELD_STATUSES,
  type FieldRecord,
} from './fieldRecords'
import { nextIn, saveOutcome } from './fieldLogic'

const records = ref<FieldRecord[]>([...FIELD_RECORDS])
const selected = ref<FieldRecord | null>(null)
const status = ref('')
const notes = ref('')
const attached = ref(false)
const saveState = ref<'idle' | 'saved' | 'error'>('idle')

const attachmentLabel = computed(() => (attached.value ? FIELD_ATTACHMENT.label : 'No attachment'))

function select(record: FieldRecord): void {
  selected.value = record
  status.value = record.status
  notes.value = record.notes
  attached.value = false
  saveState.value = 'idle'
}

function cycleStatus(): void {
  status.value = nextIn(FIELD_STATUSES, status.value)
}

function clearStatus(): void {
  status.value = ''
}

function cycleNotes(): void {
  notes.value = nextIn(FIELD_NOTES, notes.value)
}

function attach(): void {
  attached.value = true
}

function save(): void {
  saveState.value = saveOutcome(status.value)
}

</script>
<template><view class="screen" testID="field-screen"><text class="title">Field work</text><view class="queue" testID="field-list"><view v-for="record in records" :key="record.id" class="row" testID="field-row"><pressable class="row-button" testID="field-select" @press="select(record)"><text class="row-button-label">{{ record.title }}</text></pressable></view></view><view v-if="selected !== null" class="detail" testID="field-detail"><text class="status" testID="field-status">Status: {{ status }}</text><pressable class="action" testID="field-status-toggle" @press="cycleStatus()"><text class="action-label">Change the status</text></pressable><pressable class="action" testID="field-status-clear" @press="clearStatus()"><text class="action-label">Clear the status</text></pressable><text class="notes" testID="field-notes">Notes: {{ notes }}</text><pressable class="action" testID="field-notes-edit" @press="cycleNotes()"><text class="action-label">Edit the note</text></pressable><text class="attachment" testID="field-attachment">{{ attachmentLabel }}</text><pressable class="action" testID="field-attach" @press="attach()"><text class="action-label">Attach a photo</text></pressable><pressable class="save" testID="field-save" @press="save()"><text class="save-label">Save the record</text></pressable><text v-if="saveState === 'saved'" class="saved" testID="field-saved">Saved</text><view v-else-if="saveState === 'error'" class="error" testID="field-error"><text class="error-text">Could not save: a status is required.</text></view></view></view></template>
<style scoped>
.screen {
  flex: 1;
  padding: 16;
  background-color: #0b1020;
}
.title {
  font-size: 22;
  font-weight: 700;
  color: #ffffff;
}
.queue {
  margin-top: 12;
}
.row {
  padding: 8;
  border-width: 1;
  border-color: #2a3352;
  margin-bottom: 8;
}
.row-button-label {
  font-size: 16;
  color: #ffffff;
}
.detail {
  margin-top: 12;
  padding: 12;
  background-color: #141b33;
}
.status {
  font-size: 16;
  font-weight: 700;
  color: #ffffff;
}
.notes {
  font-size: 14;
  color: #9aa4c7;
}
.attachment {
  font-size: 14;
  color: #9aa4c7;
}
.action {
  margin-top: 8;
  padding: 8;
  background-color: #1f2740;
}
.action-label {
  font-size: 14;
  color: #dfe5f2;
}
.save {
  margin-top: 12;
  padding: 10;
  background-color: #2f6bff;
}
.save-label {
  font-size: 15;
  color: #ffffff;
}
.saved {
  margin-top: 8;
  font-size: 15;
  font-weight: 700;
  color: #6ee7a8;
}
.error {
  margin-top: 8;
}
.error-text {
  font-size: 15;
  font-weight: 700;
  color: #ff7a7a;
}
</style>