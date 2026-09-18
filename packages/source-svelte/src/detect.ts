import type { DetectionContext, DetectionResult } from '@navirox/source'
import { declaredRange, readManifest } from '@navirox/source'

/**
 * The Svelte adapter.
 *
 * It claims less than the Vue adapter on purpose and says so everywhere it can.
 * Svelte publishes no parser with a stable block API the way Vue does, so this
 * adapter reads the blocks it needs instead of compiling a component: it can
 * report what a component contains and it cannot reject a malformed one. That
 * difference is a finding and a support level, not a silent gap.
 */

export const FRAMEWORK = 'svelte'

export const ADAPTER_ID = 'svelte'

export const DISPLAY_NAME = 'Svelte'

/**
 * The versions this adapter has been exercised against.
 *
 * Svelte 5 is the line with runes and the one this repository tests. A project
 * on Svelte 4 gets a finding, because reading runes-era syntax as Svelte 4 is
 * exactly the mistake the range exists to prevent.
 */
export const TESTED_VERSIONS: readonly string[] = ['^5.0.0']

export function declaredMajor(range: string): number | undefined {
  const match = /\d+/.exec(range)
  return match === null ? undefined : Number(match[0])
}

/** The majors the tested ranges cover. */
export function testedMajors(versions: readonly string[]): readonly number[] {
  return versions
    .map((version) => declaredMajor(version))
    .filter((major): major is number => major !== undefined)
}

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
