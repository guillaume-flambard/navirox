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
<template>
  <main class="screen" data-testid="records-screen">
    <h1 class="title">Records</h1>
    <p v-if="status === 'loading'" class="message" data-testid="records-loading">
      Loading records...
    </p>
    <p v-else-if="status === 'empty'" class="message" data-testid="records-empty">
      No records yet.
    </p>
    <div v-else-if="status === 'error'" data-testid="records-error">
      <p class="error">Records failed to load.</p>
      <button class="retry" data-testid="records-retry" @click="retry()">Try again</button>
    </div>
    <div v-else data-testid="records-list">
      <div v-for="record in records" :key="record.id" class="row" data-testid="record-row">
        <button class="row-button" data-testid="record-select" @click="select(record)">
          {{ record.name }}
        </button>
      </div>
      <div v-if="selected !== null" class="detail" data-testid="record-detail">
        <h2 class="detail-title">{{ selected.name }}</h2>
        <p class="detail-notes">{{ selected.notes }}</p>
      </div>
    </div>
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
