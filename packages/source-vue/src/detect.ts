import type { DetectionContext, DetectionResult } from '@memolabs-apps/source'
import { declaredRange, readManifest } from '@memolabs-apps/source'

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
