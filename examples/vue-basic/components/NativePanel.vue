<!--
  The native API half of the canary: haptics and secure storage.

  Both come from @navirox/native, which resolves them out of the runtime instead
  of importing a provider, so this file names no third party package and no
  renderer. The two providers are declared in the app's manifest because that is
  the manifest React Native's autolinking reads, and the adapter is what imports
  them.

  Nothing here is allowed to reject. A device with no vibrator, or a user who
  turned haptics off in the system settings, is not something an app can act on,
  and the engine answers those calls by resolving. Anything a provider does
  raise is shown as text, because on this panel the text is the evidence.

  The timestamp is the interesting part. It is written to the keychain and read
  back on mount, so a relaunch that shows the same value proves the entry was
  kept outside the process, which is the only thing a secure store is for.
-->
<script setup lang="ts">
import { useHaptics, useSecureStore } from '@navirox/native';
import { onMounted, ref } from 'vue';

/** The key this app stores its timestamp under, in the keychain's own terms. */
const STORED_AT_KEY = 'canary.stored-at';

const haptics = useHaptics();
const secureStore = useSecureStore();

const stored = ref<string | null>(null);
const message = ref('nothing has run yet');

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Runs one call and turns a failure into the line the panel shows. */
async function attempt(label: string, run: () => Promise<void>): Promise<void> {
  try {
    await run();
  } catch (error) {
    message.value = `${label} failed: ${describe(error)}`;
  }
}

async function tap(): Promise<void> {
  await attempt('tap', async () => {
    await haptics.impact('medium');
    message.value = 'asked for a medium impact';
  });
}

async function save(): Promise<void> {
  await attempt('save', async () => {
    const stamp = new Date().toISOString();

    await secureStore.setItem(STORED_AT_KEY, stamp);
    stored.value = stamp;
    message.value = `wrote ${stamp}`;
  });
}

async function clear(): Promise<void> {
  await attempt('clear', async () => {
    await secureStore.removeItem(STORED_AT_KEY);
    stored.value = null;
    message.value = 'cleared the entry';
  });
}

async function read(): Promise<void> {
  await attempt('read', async () => {
    const value = await secureStore.getItem(STORED_AT_KEY);

    stored.value = value;
    message.value =
      value === null ? 'read: nothing was stored' : `read ${value}`;
  });
}

onMounted(() => {
  void read();
});
</script>

<template>
  <view class="panel">
    <view class="row">
      <pressable class="button" testID="haptics-tap" @press="tap">
        <text class="button-label">Tap</text>
      </pressable>
      <pressable class="button ghost" testID="store-save" @press="save">
        <text class="button-label ghost-label">Save</text>
      </pressable>
      <pressable class="button ghost end" testID="store-clear" @press="clear">
        <text class="button-label ghost-label">Clear</text>
      </pressable>
    </view>

    <text class="stored" testID="store-stored"
      >stored: {{ stored === null ? 'nothing' : stored }}</text
    >
    <text class="message" testID="store-message">{{ message }}</text>
  </view>
</template>

<style scoped>
.panel {
  margin-bottom: 12;
}

.row {
  flex-direction: row;
  margin-bottom: 8;
}

.button {
  flex: 1;
  padding: 10;
  border-radius: 10;
  align-items: center;
  background-color: #5b8cff;
  margin-right: 8;
}

.ghost {
  background-color: transparent;
  border-width: 1;
  border-color: #38425e;
}

.end {
  margin-right: 0;
}

.button-label {
  font-size: 13;
  font-weight: 600;
  color: #ffffff;
}

.ghost-label {
  color: #aab4cc;
}

.stored {
  font-size: 12;
  color: #dfe5f2;
  margin-bottom: 4;
}

.message {
  font-size: 11;
  color: #7c8db5;
}
</style>
