/**
 * The native module contracts Navirox owns, and the ids they answer to.
 *
 * A provider implements these; a façade consumes them through
 * `NativeRuntime.nativeModules`. They live in the seam rather than in
 * `@navirox/native` because both sides need them: the adapter that implements a
 * module must not import the façade (that would point the dependency arrow back
 * up the stack), and the façade must not know which provider is underneath.
 *
 * The ids are plain strings because they cross the seam as data, the same way
 * `hostComponents` tags do.
 */

/** Id of the haptics module, as `runtime.nativeModules` reports it. */
export const HAPTICS_MODULE_ID = 'haptics'

/** Id of the secure storage module, as `runtime.nativeModules` reports it. */
export const SECURE_STORE_MODULE_ID = 'secure-store'

/**
 * How strong a tap is, named after feel rather than after one provider's
 * constants, so another provider can map these onto its own vocabulary.
 */
export type HapticImpactStyle = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid'

/** What a notification haptic means. */
export type HapticNotificationType = 'success' | 'warning' | 'error'

/**
 * Haptics, as an app uses them.
 *
 * Every method resolves once the feedback has been asked for, not once a motor
 * has finished moving, and a platform that cannot vibrate resolves too. An
 * emulator has no haptics hardware and a user can turn vibration off in system
 * settings; neither is a failure an app can act on, and throwing would make a
 * canary fail on a machine with no motor.
 */
export interface HapticsModule {
  /** A tap whose weight the caller chooses. */
  impact(style: HapticImpactStyle): Promise<void>
  /** The buzz a result should feel like. */
  notification(type: HapticNotificationType): Promise<void>
  /** The lightest feedback, for a selection change. */
  selection(): Promise<void>
}

/**
 * Secure storage, as an app uses it.
 *
 * Values are strings, and anything structured is the caller's to serialise:
 * every backend stores bytes, and a JSON round trip belongs at the call site
 * rather than hidden in the seam.
 *
 * There is no `isAvailable`: every platform Navirox targets has a keystore, and
 * a capability probe that always answers yes would be a claim rather than a
 * check. `setItem` is where a device that genuinely cannot store will fail.
 */
export interface SecureStoreModule {
  /** The stored value, or `null` when nothing is stored under `key`. */
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  /** Remove the entry. Removing an entry that is not there is not an error. */
  removeItem(key: string): Promise<void>
}
