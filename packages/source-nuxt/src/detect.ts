import type { DetectionContext, DetectionResult } from '@memolabs-apps/source'
import { declaredRange, readManifest } from '@memolabs-apps/source'

/**
 * The Nuxt adapter.
 *
 * Nuxt is Vue plus conventions, so this adapter reads what Nuxt adds and
 * delegates the rest to the Vue adapter. That delegation is the composition the
 * `composes` field was declared for, and it is exercised here rather than assumed.
 *
 * The versions are declared as the two majors whose conventions this adapter
 * reads: pages, layouts and composables are the same directories in both.
 */

export const FRAMEWORK = 'nuxt'

export const ADAPTER_ID = 'nuxt'

export const DISPLAY_NAME = 'Nuxt'

export const TESTED_VERSIONS: readonly string[] = ['^3.0.0', '^4.0.0']

/** The adapter this one is built on top of. */
export const COMPOSES: readonly string[] = ['vue']

export function detect(context: DetectionContext): Promise<DetectionResult> {
  const manifest = readManifest(context, ADAPTER_ID)

  if (manifest === undefined) {
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
