import type { HostComponent, Platform } from '@navirox/runtime'

/**
 * The shape of one entry in `@symbiote-native/components/host-primitives`, which
 * is upstream's authoritative, data-only tag table. We read it rather than copy
 * it: a copy is a table that goes stale silently the next time upstream adds a
 * primitive.
 */
export interface HostPrimitiveEntry {
  readonly intrinsic: string
  readonly aliases?: Readonly<Record<string, string>>
  readonly defaults?: Readonly<Record<string, unknown>>
  readonly observesState?: boolean
  readonly intrinsicWhen?: { readonly prop: string; readonly intrinsic: string }
}

export type HostPrimitiveTable = Readonly<Record<string, HostPrimitiveEntry>>

export const DEFAULT_PLATFORMS: readonly Platform[] = ['ios', 'android']

/**
 * The intrinsic tag alphabet, derived from the primitive table.
 *
 * This mirrors upstream's `intrinsic-tags.cjs` exactly, including what it leaves
 * out: `aliases` are prop renames (`id` -> `nativeID`) and `defaults` apply to
 * props, so neither contributes a tag. Only `intrinsic` and, when present,
 * `intrinsicWhen.intrinsic` do — the "same primitive, different tag under a
 * prop" cases.
 *
 * The derivation is the point. A tag missing from the compiler's custom-element
 * set compiles to `resolveComponent("<tag>")` with its children as a slot the
 * element path never reads: a blank subtree and no error. Deriving means a new
 * upstream primitive cannot be missing.
 */
export function intrinsicTagsOf(primitives: HostPrimitiveTable): readonly string[] {
  const tags = new Set<string>()
  for (const entry of Object.values(primitives)) {
    tags.add(entry.intrinsic)
    if (entry.intrinsicWhen !== undefined) tags.add(entry.intrinsicWhen.intrinsic)
  }
  return [...tags].sort()
}

/** Builds the seam's `hostComponents` map from the primitive table. */
export function hostComponentsFrom(
  primitives: HostPrimitiveTable,
  platforms: readonly Platform[] = DEFAULT_PLATFORMS,
): Record<string, HostComponent> {
  const components: Record<string, HostComponent> = {}
  for (const tag of intrinsicTagsOf(primitives)) {
    components[tag] = { tag, platforms }
  }
  return components
}
