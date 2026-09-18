import type { DetectionCandidate, DetectionContext, DetectionResult } from '@navirox/source'
import { declaredRange, readManifest } from '@navirox/source'
import { nativeDeclarations } from '@navirox/source-react'

/**
 * Lit is thin enough that the container is the platform, but the one risk it shares with React
 * and Solid is real: a project that already aims at the native runtime is what Navirox produces
 * rather than what it reads. The refusal is imported from the React adapter instead of written
 * again, as Next, Astro and Solid do.
 */

export const FRAMEWORK = 'lit'
export const ADAPTER_ID = 'lit'
export const DISPLAY_NAME = 'Lit'

/** The lit line this adapter has been exercised against. */
export const TESTED_VERSIONS = ['^3.0.0']

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

  const evidence = {
    kind: 'manifest' as const,
    value: `${manifest.source.file} ${declared.field}.${FRAMEWORK} ${declared.range}`,
  }
  const candidate: DetectionCandidate = { confidence: 'high', evidence: [evidence] }

  return Promise.resolve({ candidates: [candidate] })
}
