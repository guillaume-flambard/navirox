import type { Platform } from '@navirox/runtime'
import manifestJson from './runtime.json' with { type: 'json' }

/**
 * The runtime manifest: the passive description of what this adapter is and what
 * it was built against. It is the single source of truth shared by
 * `@navirox/compat` and `navirox doctor`, so the adapter and the compatibility
 * registry cannot drift apart.
 *
 * It ships as real, readable JSON at `@navirox/runtime-symbiote/runtime.json` so
 * tooling reads the same bytes this module imports.
 */
export interface RuntimeManifest {
  /** Runtime id, matching `NativeRuntime.id`. */
  readonly id: string
  /**
   * The exact versions this adapter was built and tested against. In the same
   * shape as a package.json dependency map, because that is what it is checked
   * against.
   */
  readonly packages: Readonly<Record<string, string>>
  /**
   * The ranges a consuming app may satisfy. `packages` are the exact versions
   * *we* install; `versionRange` is what we promise still works.
   */
  readonly versionRange: Readonly<Record<string, string>>
  /**
   * Whether this adapter has been observed working on each platform.
   * `null` means "not yet verified" and must never be read as "no". It is
   * evidence, not intent: it flips only when `examples/vue-basic` renders.
   */
  readonly verified: Readonly<Record<Platform, boolean | null>>
  readonly capabilities: {
    readonly newArch: boolean
    readonly fabric: boolean
    readonly legacyFallback: boolean
  }
  readonly notes: string
}

export const RUNTIME_MANIFEST = manifestJson as RuntimeManifest

/**
 * Every package version this adapter pins, as a `name -> specifier` map suitable
 * for comparison against a package.json `dependencies` block.
 */
export function manifestPins(manifest: RuntimeManifest = RUNTIME_MANIFEST): Record<string, string> {
  return { ...manifest.packages }
}

/**
 * Compares the manifest's exact pins against a package.json dependency block and
 * returns human-readable problems, empty when they agree.
 *
 * This exists because the manifest is only useful if it describes the code that
 * actually shipped. A manifest that says `2.0.0` while the package resolves
 * `2.1.0` is worse than no manifest: `doctor` would certify a combination
 * nobody ever ran.
 */
export function diffManifestPins(
  declared: Readonly<Record<string, string>>,
  manifest: RuntimeManifest = RUNTIME_MANIFEST,
): readonly string[] {
  const problems: string[] = []
  for (const [name, pinned] of Object.entries(manifest.packages)) {
    const specifier = declared[name]
    if (specifier === undefined) {
      problems.push(
        `${name} is pinned in the manifest at ${pinned} but is not declared as a dependency`,
      )
      continue
    }
    if (specifier !== pinned) {
      problems.push(`${name} is declared as "${specifier}" but the manifest pins ${pinned}`)
    }
  }
  return problems
}

/**
 * Checks that a concrete installed version satisfies one of this adapter's
 * declared ranges. Deliberately handles only the two forms the manifest uses
 * (`^x.y.z` and `>=x.y.z`) instead of pulling a semver library in for it; if the
 * manifest ever needs a richer range, this is the place that grows.
 */
export function satisfiesRange(version: string, range: string): boolean {
  const installed = parseVersion(version)
  if (installed === undefined) return false

  if (range.startsWith('^')) {
    const floor = parseVersion(range.slice(1))
    if (floor === undefined || floor.major !== installed.major) return false
    return compare(installed, floor) >= 0
  }

  if (range.startsWith('>=')) {
    const floor = parseVersion(range.slice(2))
    if (floor === undefined) return false
    return compare(installed, floor) >= 0
  }

  return version === range
}

interface IVersion {
  readonly major: number
  readonly minor: number
  readonly patch: number
}

function parseVersion(value: string): IVersion | undefined {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(value.trim())
  if (match === null) return undefined
  const [, major, minor, patch] = match
  if (major === undefined || minor === undefined || patch === undefined) return undefined
  return { major: Number(major), minor: Number(minor), patch: Number(patch) }
}

function compare(a: IVersion, b: IVersion): number {
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch
}
