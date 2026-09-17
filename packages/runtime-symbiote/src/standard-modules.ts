import type {
  HapticImpactStyle,
  HapticNotificationType,
  HapticsModule,
  SecureStoreModule,
} from '@navirox/runtime'

/**
 * The two standard modules, mapped from the provider's vocabulary onto the
 * seam's contracts.
 *
 * The factories are pure and take structural providers, so the mapping is
 * testable with two-line fakes and a different provider only has to match these
 * members. `./bootstrap.ts` is where the real packages are named, because that
 * is the one file allowed to touch the host.
 */

/** The slice of a haptics provider this adapter uses. */
export interface IHapticsProvider {
  trigger(method: string, options?: Record<string, unknown>): void
}

/** The slice of a keychain-shaped store this adapter uses. */
export interface ISecureStoreProvider {
  setGenericPassword(
    username: string,
    password: string,
    options?: { service?: string },
  ): Promise<unknown>
  getGenericPassword(options?: { service?: string }): Promise<false | { password?: string | null }>
  resetGenericPassword(options?: { service?: string }): Promise<unknown>
}

/** Our impact vocabulary, mapped onto the provider's method names. */
const IMPACT_METHODS: Readonly<Record<HapticImpactStyle, string>> = {
  light: 'impactLight',
  medium: 'impactMedium',
  heavy: 'impactHeavy',
  soft: 'soft',
  rigid: 'rigid',
}

/** Our notification vocabulary, mapped onto the provider's method names. */
const NOTIFICATION_METHODS: Readonly<Record<HapticNotificationType, string>> = {
  success: 'notificationSuccess',
  warning: 'notificationWarning',
  error: 'notificationError',
}

/**
 * What every haptic call passes, taken from the provider's own README rather
 * than from memory: `enableVibrateFallback: true` so a device with no Taptic
 * Engine still vibrates instead of staying silent, and
 * `ignoreAndroidSystemSettings: false` so someone who turned vibration off in
 * system settings keeps it off. Both are also the values its own usage example
 * passes, and the defaults it documents are `false`.
 */
const HAPTIC_OPTIONS: Readonly<Record<string, unknown>> = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
}

/**
 * The username a secure entry is written under.
 *
 * A keychain entry is a service plus a username/password pair, and Navirox's
 * key/value pair maps onto service/password because that is the closest match:
 * the service is the per-entry namespace, which is exactly what a key is. The
 * username has no Navirox meaning, so it is a constant an app never sees.
 */
const SECURE_STORE_USERNAME = 'navirox'

/** The seam's haptics contract, over a provider that triggers by method name. */
export function createHapticsModule(provider: IHapticsProvider): HapticsModule {
  // Async so a provider that throws synchronously still rejects the promise it
  // returned: the contract says every method resolves or rejects, never throws.
  const fire = async (method: string): Promise<void> => {
    provider.trigger(method, { ...HAPTIC_OPTIONS })
  }

  return {
    impact: (style) => fire(IMPACT_METHODS[style]),
    notification: (type) => fire(NOTIFICATION_METHODS[type]),
    selection: () => fire('selection'),
  }
}

/** The seam's secure storage contract, over a keychain-shaped provider. */
export function createSecureStoreModule(provider: ISecureStoreProvider): SecureStoreModule {
  return {
    async getItem(key: string): Promise<string | null> {
      const entry = await provider.getGenericPassword({ service: key })
      if (entry === false) return null
      return entry.password ?? null
    },

    async setItem(key: string, value: string): Promise<void> {
      await provider.setGenericPassword(SECURE_STORE_USERNAME, value, { service: key })
    },

    async removeItem(key: string): Promise<void> {
      await provider.resetGenericPassword({ service: key })
    },
  }
}
