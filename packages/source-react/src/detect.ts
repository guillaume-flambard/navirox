import type { DetectionContext, DetectionResult } from '@navirox/source'
import { declaredRange, readManifest } from '@navirox/source'

/**
 * The React adapter.
 *
 * It is the adapter most at risk of reading the target as the source. React
 * Native is React, the App Graph speaks in React's language, and the packages this
 * repository ships are React packages. Detection therefore refuses a project that
 * declares the native runtime: a React Native application is what Navirox
 * produces, not what it reads, and an adapter that accepted one would invite the
 * exact confusion the architecture is built to prevent.
 */

export const FRAMEWORK = 'react'

/** The runtime Navirox targets. Declaring it makes a project a target, not a source. */
export const NATIVE_RUNTIME = 'react-native'

/** Native module prefixes that also mark a project as target side. */
export const NATIVE_PREFIXES: readonly string[] = [
  'react-native-',
  '@react-native',
  '@symbiote-native/',
]

export const ADAPTER_ID = 'react'

export const DISPLAY_NAME = 'React'

/** The major this adapter was written against. */
export const TESTED_VERSIONS: readonly string[] = ['^19.0.0']

/** A dependency group, as a manifest holds it. */
function group(manifest: Record<string, unknown>, field: string): Record<string, unknown> {
  const value = manifest[field]

  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

/** Every declared dependency name, across the groups a project can declare them in. */
export function declaredNames(manifest: Record<string, unknown>): readonly string[] {
  return [
    ...Object.keys(group(manifest, 'dependencies')),
    ...Object.keys(group(manifest, 'devDependencies')),
    ...Object.keys(group(manifest, 'peerDependencies')),
  ]
}

/** The declared names that mark a project as target side rather than web source. */
export function nativeDeclarations(manifest: Record<string, unknown>): readonly string[] {
  return declaredNames(manifest)
    .filter(
      (name) =>
        name === NATIVE_RUNTIME || NATIVE_PREFIXES.some((prefix) => name.startsWith(prefix)),
    )
    .sort()
}

export function detect(context: DetectionContext): Promise<DetectionResult> {
  const manifest = readManifest(context, ADAPTER_ID)

  if (manifest === undefined) {
    return Promise.resolve({ candidates: [] })
  }

  if (nativeDeclarations(manifest.json).length > 0) {
    return Promise.resolve({ candidates: [] })
  }

  const declared = declaredRange(manifest, FRAMEWORK)

  if (declared === undefined) {
    return Promise.resolve({ candidates: [] })
  }

  const evidence = [
    {
      kind: 'manifest' as const,
      value: `${manifest.source.file} ${declared.field}.${FRAMEWORK} ${declared.range}`,
    },
  ]

  return Promise.resolve({ candidates: [{ confidence: 'high', evidence }] })
}
