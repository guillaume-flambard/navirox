import type { NativeRuntime, RuntimeFactory, RuntimeFactoryOptions } from './types.js'

/** Members a runtime must expose as a value. */
const REQUIRED_VALUES = [
  'id',
  'version',
  'hostComponents',
  'components',
  'nativeModules',
  'navigation',
  'capabilities',
] as const

/** Members a runtime must expose as a callable. */
const REQUIRED_FUNCTIONS = ['mount', 'registerNativeComponent'] as const

function describe(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'an array'
  return `a ${typeof value}`
}

/**
 * Assert that a value satisfies the {@link NativeRuntime} seam.
 *
 * A broken adapter then fails where it is built, naming the offending member,
 * rather than at some later call site with an unrelated stack trace.
 */
export function assertNativeRuntime(value: unknown): asserts value is NativeRuntime {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError(`A Navirox runtime must be an object, received ${describe(value)}.`)
  }

  const candidate = value as Record<string, unknown>
  const problems: string[] = []

  for (const key of REQUIRED_VALUES) {
    if (candidate[key] === undefined || candidate[key] === null) {
      problems.push(`missing "${key}"`)
    }
  }
  for (const key of REQUIRED_FUNCTIONS) {
    if (typeof candidate[key] !== 'function') {
      problems.push(`"${key}" must be a function`)
    }
  }

  if (problems.length > 0) {
    throw new TypeError(
      `Invalid Navirox runtime: ${problems.join(', ')}. ` +
        'A runtime must implement the NativeRuntime interface from @memolabs-apps/runtime.',
    )
  }
}

/**
 * Build a runtime from a factory, then validate it.
 *
 * Always go through this rather than calling a factory directly. It is the one
 * place that guarantees a swapped runtime still satisfies the seam, which is
 * what lets the renderer underneath stay replaceable by design.
 */
export function createRuntime(
  impl: RuntimeFactory,
  options: RuntimeFactoryOptions = {},
): NativeRuntime {
  if (typeof impl !== 'function') {
    throw new TypeError(
      `createRuntime expects a RuntimeFactory function, received ${describe(impl)}.`,
    )
  }

  const runtime = impl(options)
  assertNativeRuntime(runtime)
  return runtime
}
