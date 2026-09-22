<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  FIELD_ATTACHMENT,
  FIELD_NOTES,
  FIELD_RECORDS,
  FIELD_STATUSES,
  type FieldRecord,
} from './fieldRecords'

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

function nextIn(values: readonly string[], current: string): string {
  const index = values.indexOf(current)
  return values[(index + 1) % values.length] ?? ''
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
  saveState.value = status.value.trim().length === 0 ? 'error' : 'saved'
}
</script>
<template>
  <main class="screen" data-testid="field-screen">
    <h1 class="title">Field work</h1>
    <ul class="queue" data-testid="field-list">
      <li v-for="record in records" :key="record.id" class="row" data-testid="field-row">
        <button class="row-button" data-testid="field-select" @click="select(record)">
          <span class="row-button-label">{{ record.title }}</span>
        </button>
      </li>
    </ul>
    <section v-if="selected !== null" class="detail" data-testid="field-detail">
      <p class="status" data-testid="field-status">Status: {{ status }}</p>
      <button class="action" data-testid="field-status-toggle" @click="cycleStatus()">
        <span class="action-label">Change the status</span>
      </button>
      <button class="action" data-testid="field-status-clear" @click="clearStatus()">
        <span class="action-label">Clear the status</span>
      </button>
      <p class="notes" data-testid="field-notes">Notes: {{ notes }}</p>
      <button class="action" data-testid="field-notes-edit" @click="cycleNotes()">
        <span class="action-label">Edit the note</span>
      </button>
      <p class="attachment" data-testid="field-attachment">{{ attachmentLabel }}</p>
      <button class="action" data-testid="field-attach" @click="attach()">
        <span class="action-label">Attach a photo</span>
      </button>
      <button class="save" data-testid="field-save" @click="save()">
        <span class="save-label">Save the record</span>
      </button>
      <p v-if="saveState === 'saved'" class="saved" data-testid="field-saved">Saved</p>
      <div v-else-if="saveState === 'error'" class="error" data-testid="field-error">
        <p class="error-text">Could not save: a status is required.</p>
      </div>
    </section>
  </main>
</template>
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
