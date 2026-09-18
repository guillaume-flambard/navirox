import type { DetectionContext, DetectionResult } from '@navirox/source'
import { declaredRange, readManifest } from '@navirox/source'
import { nativeDeclarations } from '@navirox/source-react'

/**
 * The Qwik adapter.
 *
 * Qwik is the second source read through JSX, so the risk React named applies
 * here too and for the same reason: a project that already declares a native
 * runtime is what Navirox produces rather than what it reads. The refusal is
 * imported from the React adapter instead of written a fifth time.
 */

export const FRAMEWORK = '@builder.io/qwik'

export const ADAPTER_ID = 'qwik'

export const DISPLAY_NAME = 'Qwik'

/** The Qwik line this adapter has been exercised against. */
export const TESTED_VERSIONS: readonly string[] = ['^1.20.0']

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

  return Promise.resolve({ candidates: [{ confidence: 'high', evidence: [evidence] }] })
}
