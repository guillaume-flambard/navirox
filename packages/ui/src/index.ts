import { PACKAGE_NAME as SEAM_PACKAGE_NAME } from '@navirox/runtime'
import type { HostComponent, NativeRuntime, Platform } from '@navirox/runtime'

/** Canonical npm name of this package. Kept in code so the import
 *  boundary checks can assert against it without reading package.json. */
export const PACKAGE_NAME = '@navirox/ui'

/** One line describing this package's role in the Navirox stack. */
export const PACKAGE_ROLE =
  'Curated native component facade: View, Text, Pressable, ScrollView, TextInput, FlatList.'

/** The package this one is built on. Every public Navirox package sits on the
 *  runtime seam rather than on a concrete runtime. */
export const BUILT_ON: string = SEAM_PACKAGE_NAME

/** Tag names Navirox 0.1 promises to render, in the upstream intrinsic spelling. */
export const REQUIRED_HOST_COMPONENTS: readonly string[] = [
  'view',
  'text',
  'pressable',
  'text-input',
  'scroll-view',
]

/** The component surface resolved for one runtime. */
export interface ComponentSurface {
  /** Tags the caller asked for, in the order they were asked for. */
  readonly tags: readonly string[]
  /** The runtime's definition for each of those tags. */
  readonly components: Readonly<Record<string, HostComponent>>
  /** Platforms on which every requested primitive exists. */
  readonly platforms: readonly Platform[]
}

/**
 * Resolve host primitives from a runtime.
 *
 * Throws when the runtime cannot supply one, naming the missing tags. A renderer
 * swap that loses a primitive should fail here, once, with a readable message,
 * rather than as a blank screen somewhere inside a template.
 */
export function resolveHostComponents(
  runtime: NativeRuntime,
  tags: readonly string[] = REQUIRED_HOST_COMPONENTS,
): Readonly<Record<string, HostComponent>> {
  const resolved: Record<string, HostComponent> = {}
  const missing: string[] = []

  for (const tag of tags) {
    const component = runtime.hostComponents[tag]
    if (component === undefined) {
      missing.push(tag)
    } else {
      resolved[tag] = component
    }
  }

  if (missing.length > 0) {
    const quote = (names: readonly string[]) => names.map((name) => `"${name}"`).join(', ')
    throw new Error(
      `The "${runtime.id}" runtime does not provide ${quote(missing)}. ` +
        `Navirox 0.1 requires ${quote(tags)}.`,
    )
  }

  return resolved
}

/**
 * The component surface for a runtime, validated once at startup.
 *
 * This is the first layer of the facade. The components themselves land with
 * the component workstream; what exists here is the check that the runtime
 * underneath can back them at all.
 */
export function createComponentSurface(
  runtime: NativeRuntime,
  tags: readonly string[] = REQUIRED_HOST_COMPONENTS,
): ComponentSurface {
  const components = resolveHostComponents(runtime, tags)
  const platforms = runtime.capabilities.platforms.filter((platform) =>
    tags.every((tag) => components[tag]?.platforms.includes(platform) === true),
  )

  return { tags: [...tags], components, platforms }
}
