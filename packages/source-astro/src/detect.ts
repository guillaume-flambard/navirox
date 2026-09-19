import type { DetectionContext, DetectionResult } from '@memolabs-apps/source'
import { declaredRange, readManifest } from '@memolabs-apps/source'
import { nativeDeclarations } from '@memolabs-apps/source-react'

/** The framework this adapter reads, as the manifest names it. */
export const FRAMEWORK = 'astro'

/** The adapter id. Every node this adapter reports carries it. */
export const ADAPTER_ID = 'astro'

export const DISPLAY_NAME = 'Astro'

/**
 * The majors this adapter was written against. `astro` was 7.3.3 when the
 * fixture was written. A project on another major is read and reported, not
 * quietly treated as supported.
 */
export const TESTED_VERSIONS = ['^7.0.0']

/**
 * The island adapters this one hands components to. Astro is the first adapter
 * that composes more than one: a page may hold a Vue component, a Svelte
 * component and a React component at once, and the file that holds them is the
 * point of composition rather than a fourth framework. Selection already
 * prefers an adapter whose id another candidate declares it composes, so this
 * list is what makes Astro win a project that also declares its islands.
 */
export const COMPOSES = ['vue', 'react', 'svelte']

/**
 * A project is Astro if it says so, and a project already aimed at the native
 * runtime is refused. The refusal is inherited from the React adapter rather
 * than re-written, because the list of what counts as a native declaration is
 * one question asked once: an application that depends on React Native is what
 * Navirox produces, not what it reads.
 */
export async function detect(context: DetectionContext): Promise<DetectionResult> {
  const manifest = readManifest(context, ADAPTER_ID)
  if (manifest === undefined) {
    return { candidates: [] }
  }

  const declared = declaredRange(manifest, FRAMEWORK)
  if (declared === undefined) {
    return { candidates: [] }
  }

  if (nativeDeclarations(manifest.json).length > 0) {
    return { candidates: [] }
  }

  return {
    candidates: [
      {
        confidence: 'high',
        evidence: [
          {
            kind: 'manifest',
            value: `${manifest.source} ${declared.field}.${FRAMEWORK} ${declared.range}`,
          },
        ],
      },
    ],
  }
}
