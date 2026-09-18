import type { DetectionContext, DetectionResult } from '@navirox/source'
import { declaredRange, readManifest } from '@navirox/source'

/**
 * The framework this adapter is for. One constant, because it appears in the
 * declared tested range, in the detection match and in the package name.
 */
export const FRAMEWORK = 'vue'

/** The identifier that prefixes every node this adapter produces. */
export const ADAPTER_ID = 'vue'

export const DISPLAY_NAME = 'Vue'

/**
 * The versions this adapter has been exercised against.
 *
 * Declared, not derived. A project on a major that is not here is a finding, and
 * the point of the declaration is that the finding can be produced at all.
 */
export const TESTED_VERSIONS: readonly string[] = ['^3.5.0']

/**
 * The major version a range is asking for, when the range names one.
 *
 * This is a reading of the manifest, not a resolution: without an installed tree
 * there is no resolved version to ask about, so the adapter works with the major
 * the project declared and the finding says as much.
 */
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

/**
 * Recognizes a Vue project from what it declares.
 *
 * Detection reads the manifest and nothing else, and it never throws: a project
 * it cannot read is a project it does not recognize, which is a legitimate
 * answer the caller turns into "no adapter for this directory".
 */
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
