import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

// Exercise the *installed, pnpm-patched* Detox implementation consumed by the
// generated Vue fixture. Reading the source patch alone would miss a lockfile
// or patchedDependencies misconfiguration.
const requireFromFixture = createRequire(
  resolve(import.meta.dirname, '../../../examples/vue-basic/package.json'),
)
const ADB = requireFromFixture('detox/src/devices/common/drivers/android/exec/ADB.js') as {
  prototype: {
    reverseRemove: (
      this: { adbCmd: (deviceId: string, command: string) => Promise<unknown> },
      deviceId: string,
      port: number,
    ) => Promise<unknown>
  }
}

const PORT = 37667
const DEVICE = 'emulator-5554'
const reverse = ADB.prototype.reverseRemove

describe('the pinned Detox Android teardown correction', () => {
  it('treats only an already-absent matching listener as idempotent cleanup', async () => {
    const adbCmd = vi
      .fn()
      .mockRejectedValue(
        new Error(
          `Command failed: adb reverse --remove tcp:${PORT}\nadb: error: listener 'tcp:${PORT}' not found`,
        ),
      )
    await expect(reverse.call({ adbCmd }, DEVICE, PORT)).resolves.toBeUndefined()
    expect(adbCmd).toHaveBeenCalledExactlyOnceWith(DEVICE, `reverse --remove tcp:${PORT}`)
  })

  it('does not suppress a missing *different* listener', async () => {
    const adbCmd = vi
      .fn()
      .mockRejectedValue(new Error(`adb: error: listener 'tcp:${PORT + 1}' not found`))
    await expect(reverse.call({ adbCmd }, DEVICE, PORT)).rejects.toThrow(
      `listener 'tcp:${PORT + 1}' not found`,
    )
  })

  it.each([
    'adb: error: device offline',
    'adb: error: more than one device/emulator',
    'permission denied',
  ])('keeps unrelated ADB failures fatal: %s', async (message) => {
    const adbCmd = vi.fn().mockRejectedValue(new Error(message))
    await expect(reverse.call({ adbCmd }, DEVICE, PORT)).rejects.toThrow(message)
  })

  it('preserves a successful ADB removal result', async () => {
    const output = { status: 0, stdout: '' }
    const adbCmd = vi.fn().mockResolvedValue(output)
    await expect(reverse.call({ adbCmd }, DEVICE, PORT)).resolves.toBe(output)
    expect(adbCmd).toHaveBeenCalledExactlyOnceWith(DEVICE, `reverse --remove tcp:${PORT}`)
  })
})
