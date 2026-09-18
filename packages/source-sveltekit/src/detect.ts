import type { DetectionContext, DetectionResult } from '@navirox/source'
import { declaredRange, readManifest } from '@navirox/source'

/**
 * The SvelteKit adapter.
 *
 * It is a meta-framework adapter: it reads nothing about components itself, it
 * composes the Svelte adapter for that, and it contributes the one thing
 * SvelteKit has that Svelte does not, which is a router whose contract is the
 * filesystem. `composes` is what makes the registry prefer it, without the
 * registry knowing either name.
 */

export const FRAMEWORK = '@sveltejs/kit'

export const ADAPTER_ID = 'sveltekit'

export const DISPLAY_NAME = 'SvelteKit'

/** The versions this adapter has been exercised against. */
export const TESTED_VERSIONS: readonly string[] = ['^2.0.0']

/** The adapter this one is built on top of. */
export const COMPOSES: readonly string[] = ['svelte']

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
