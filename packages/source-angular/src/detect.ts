import type { DetectionContext, DetectionResult } from '@navirox/source'
import { declaredRange, readManifest } from '@navirox/source'

/**
 * The Angular adapter.
 *
 * It is the first adapter whose framework assembles an application in a way none
 * of the others do: structure comes from decorators rather than from a file
 * format, state comes from what a class holds rather than from a store library,
 * and routing is TypeScript rather than a directory. That is exactly why it is
 * here, and the answer to whether the neutral model survived it is recorded in
 * the evidence rather than assumed.
 */

export const FRAMEWORK = '@angular/core'

export const ADAPTER_ID = 'angular'

export const DISPLAY_NAME = 'Angular'

/**
 * The majors this adapter was written against.
 *
 * The standalone era, where a component declares its own imports and an
 * application does not need a module to exist. A project on an older major is a
 * finding, because the module era is not what this reading describes.
 */
export const TESTED_VERSIONS: readonly string[] = ['^20.0.0', '^21.0.0']

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
