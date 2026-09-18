import type { DetectionCandidate, DetectionContext, DetectionResult } from '@navirox/source'
import { SOURCE_FRAMEWORK_PATTERNS, matchesPattern, readManifest } from '@navirox/source'
import { declaredNames, nativeDeclarations } from '@navirox/source-react'

/**
 * This is the only adapter that claims a project by what it does not declare, so it has to be
 * careful in both directions. It must not claim a project a framework adapter will claim, and
 * it must not claim a package that is a library rather than a web application.
 *
 * The list of frameworks is the one the neutral boundary already declares to keep framework
 * imports out of the core. Reusing it keeps adding a framework a one-line data change in one
 * place instead of a second list that would drift.
 *
 * The refusal of a project that aims at the native runtime is imported from the React adapter,
 * as Next, Astro, Solid and Lit do.
 */

export const FRAMEWORK = 'html'
export const ADAPTER_ID = 'vanilla'
export const DISPLAY_NAME = 'Vanilla HTML/CSS/JS'

/** A living standard has no version to test against, and pretending otherwise would be a lie. */
export const TESTED_VERSIONS = ['living standard']

export const DOCUMENT_EXTENSIONS = ['.html', '.htm'] as const

export function isDocument(file: string): boolean {
  return DOCUMENT_EXTENSIONS.some((extension) => file.endsWith(extension))
}

export function detect(context: DetectionContext): Promise<DetectionResult> {
  const manifest = readManifest(context, ADAPTER_ID)

  if (manifest === undefined) {
    return Promise.resolve({ candidates: [] })
  }

  if (nativeDeclarations(manifest.json).length > 0) {
    return Promise.resolve({ candidates: [] })
  }

  const frameworks = declaredNames(manifest.json).filter((name) =>
    matchesPattern(SOURCE_FRAMEWORK_PATTERNS, name),
  )

  if (frameworks.length > 0) {
    return Promise.resolve({ candidates: [] })
  }

  const document = context.files.find(isDocument)

  if (document === undefined) {
    return Promise.resolve({ candidates: [] })
  }

  // Low confidence on purpose: any framework that matched offers more, so selection prefers it
  // and this adapter is only ever reached when nothing else claimed the project.
  const candidate: DetectionCandidate = {
    confidence: 'low',
    evidence: [
      { kind: 'manifest', value: `${manifest.source.file} declares no source framework` },
      { kind: 'source', value: document },
    ],
  }

  return Promise.resolve({ candidates: [candidate] })
}
