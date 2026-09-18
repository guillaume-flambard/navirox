import type { DetectionCandidate, DetectionContext, DetectionResult } from '@navirox/source'
import { declaredRange, readManifest } from '@navirox/source'
import { nativeDeclarations } from '@navirox/source-react'

/**
 * Where a Solid project is recognised, and where it is refused.
 *
 * Solid is the second framework read through JSX, so the risk React named
 * applies here too: a project that already declares the native runtime is what
 * Navirox produces rather than what it reads. The refusal is imported from the
 * React adapter instead of being written a fourth time, which is the same
 * choice the Next and Astro adapters made.
 */

export const FRAMEWORK = 'solid-js'

export const ADAPTER_ID = 'solid'

export const DISPLAY_NAME = 'Solid'

/** The solid-js line this adapter has been exercised against. */
export const TESTED_VERSIONS = ['^1.9.0']

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
