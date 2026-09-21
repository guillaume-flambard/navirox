<script setup lang="ts">

import { ref } from 'vue'

interface TableRecord {
  readonly id: number
  readonly name: string
  readonly notes: string
}

const records = ref<TableRecord[]>([
  { id: 1, name: 'Alpha', notes: 'First record' },
  { id: 2, name: 'Beta', notes: 'Second record' },
])
const selected = ref<TableRecord | null>(null)
const status = ref<'loading' | 'ready' | 'empty' | 'error'>('ready')

function select(record: TableRecord): void {
  selected.value = record
}

function retry(): void {
  status.value = 'loading'
}

</script>
<template><view class="screen" testID="records-screen"><text class="title">Records</text><text v-if="status === 'loading'" class="message" testID="records-loading">
      Loading records...
    </text><text v-else-if="status === 'empty'" class="message" testID="records-empty">
      No records yet.
    </text><view v-else-if="status === 'error'" testID="records-error"><text class="error">Records failed to load.</text><pressable class="retry" testID="records-retry" @press="retry()">Try again</pressable></view><view v-else testID="records-list"><view v-for="record in records" :key="record.id" class="row" testID="record-row"><pressable class="row-button" testID="record-select" @press="select(record)">{{ record.name }}</pressable></view><view v-if="selected !== null" class="detail" testID="record-detail"><text class="detail-title">{{ selected.name }}</text><text class="detail-notes">{{ selected.notes }}</text></view></view></view></template>
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
.message {
  font-size: 15;
  color: #9aa4c7;
}
.error {
  font-size: 15;
  font-weight: 700;
  color: #ff7a7a;
}
.retry {
  margin-top: 8;
  padding: 8;
  background-color: #2f6bff;
  color: #ffffff;
}
.row {
  padding: 8;
  border-width: 1;
  border-color: #2a3352;
}
.row-button {
  font-size: 16;
  color: #ffffff;
}
.detail {
  margin-top: 12;
  padding: 12;
  background-color: #141b33;
}
.detail-title {
  font-size: 18;
  font-weight: 700;
  color: #ffffff;
}
.detail-notes {
  font-size: 14;
  line-height: 20;
  color: #9aa4c7;
}
</style>