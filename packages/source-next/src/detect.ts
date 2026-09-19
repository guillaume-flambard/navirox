import type { DetectionContext, DetectionResult } from '@memolabs-apps/source'
import { declaredRange, readManifest } from '@memolabs-apps/source'
import { nativeDeclarations } from '@memolabs-apps/source-react'

/**
 * The Next adapter.
 *
 * Next is React plus conventions, so this adapter composes the React adapter and
 * reads what Next adds: two routers, layouts, and a module boundary the framework
 * makes explicit.
 *
 * It also inherits the refusal. A project that declares the native runtime is what
 * Navirox produces rather than what it reads, and that is true whether the project
 * is written in React or in Next, so the check comes from the adapter this one is
 * built on rather than being written twice.
 */

export const FRAMEWORK = 'next'

export const ADAPTER_ID = 'next'

export const DISPLAY_NAME = 'Next'

/** The major this adapter was written against. */
export const TESTED_VERSIONS: readonly string[] = ['^15.0.0']

/** The adapter this one is built on top of. */
export const COMPOSES: readonly string[] = ['react']

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
