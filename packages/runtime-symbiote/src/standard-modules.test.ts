import { describe, expect, it } from 'vitest'
import {
  createHapticsModule,
  createSecureStoreModule,
  type IHapticsProvider,
  type ISecureStoreProvider,
} from './standard-modules'

/**
 * The two modules are tested against hand-written providers rather than the
 * packages themselves, because the packages cannot be loaded outside a device
 * and what is worth pinning down is the mapping: our vocabulary onto theirs,
 * and the failure behaviour when a device has no motor or no keystore.
 */
function recordingHaptics(): {
  calls: [string, Record<string, unknown> | undefined][]
  provider: IHapticsProvider
} {
  const calls: [string, Record<string, unknown> | undefined][] = []

  return {
    calls,
    provider: {
      trigger: (method, options) => {
        calls.push([method, options])
      },
    },
  }
}

describe('the haptics module', () => {
  it('maps every style and notification we name onto a provider method', async () => {
    const { calls, provider } = recordingHaptics()
    const haptics = createHapticsModule(provider)

    for (const style of ['light', 'medium', 'heavy', 'soft', 'rigid'] as const) {
      await haptics.impact(style)
    }
    for (const type of ['success', 'warning', 'error'] as const) {
      await haptics.notification(type)
    }
    await haptics.selection()

    expect(calls.map(([method]) => method)).toEqual([
      'impactLight',
      'impactMedium',
      'impactHeavy',
      'soft',
      'rigid',
      'notificationSuccess',
      'notificationWarning',
      'notificationError',
      'selection',
    ])
    // The options are the pair the provider's README documents for an app that
    // wants a fallback vibration and still respects the platform's own switch.
    for (const [, options] of calls) {
      expect(options).toEqual({
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      })
    }
  })

  it('rejects rather than throwing when the provider throws synchronously', async () => {
    // A native call that is missing fails synchronously in some builds. An app
    // awaiting this should catch a rejection, not an exception from a call that
    // looked asynchronous.
    const haptics = createHapticsModule({
      trigger: () => {
        throw new Error('no haptic engine here')
      },
    })

    await expect(haptics.impact('light')).rejects.toThrow(/no haptic engine here/)
  })
})

describe('the secure store module', () => {
  it('keys an entry by service and keeps the value as the password', async () => {
    const calls: unknown[][] = []
    const provider: ISecureStoreProvider = {
      setGenericPassword: (username, password, options) => {
        calls.push(['set', username, password, options])
        return Promise.resolve({})
      },
      getGenericPassword: (options) => {
        calls.push(['get', options])
        return Promise.resolve({ password: 'a token' })
      },
      resetGenericPassword: (options) => {
        calls.push(['reset', options])
        return Promise.resolve(true)
      },
    }
    const store = createSecureStoreModule(provider)

    await store.setItem('token', 'a token')
    await expect(store.getItem('token')).resolves.toBe('a token')
    await store.removeItem('token')

    expect(calls).toEqual([
      // The username carries no Navirox meaning, so it is the adapter's fixed
      // one rather than anything an app passes.
      ['set', 'navirox', 'a token', { service: 'token' }],
      ['get', { service: 'token' }],
      ['reset', { service: 'token' }],
    ])
  })

  it('reads a missing entry as null, not as a failure', async () => {
    const store = createSecureStoreModule({
      setGenericPassword: () => Promise.resolve({}),
      getGenericPassword: () => Promise.resolve(false),
      resetGenericPassword: () => Promise.resolve(false),
    })

    await expect(store.getItem('never-written')).resolves.toBeNull()
  })
})
