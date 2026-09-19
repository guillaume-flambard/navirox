import type { SourceLocation } from '@memolabs-apps/graph'

/**
 * A parsed manifest, with where it was read from.
 *
 * Manifest reading is neutral: every source framework declares itself in the
 * same file and the same fields. It moved here with the capability scan, for the
 * same reason and at the same moment.
 */
export interface Manifest {
  readonly json: Record<string, unknown>
  readonly source: SourceLocation
  readonly text: string
}

/** A dependency and the field that declared it. */
export interface DeclaredRange {
  readonly field: string
  readonly range: string
}

/** The one manifest this adapter reads. */
export const MANIFEST_FILE = 'package.json'

/** Fields a dependency can be declared in, in the order they are searched. */
const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies'] as const

/** The smallest reader shape both contexts already satisfy. */
export interface TextReader {
  readonly readText: (path: string) => string | undefined
}

/**
 * Reads the manifest, or returns undefined.
 *
 * A missing manifest and a malformed one are the same answer here: this adapter
 * has nothing to say about a project whose dependencies it cannot read, and the
 * difference between the two is an inspection finding rather than a detection
 * result.
 */
export function readManifest(reader: TextReader, adapterId: string): Manifest | undefined {
  const text = reader.readText(MANIFEST_FILE)

  if (text === undefined) {
    return undefined
  }

  try {
    const json: unknown = JSON.parse(text)

    if (typeof json !== 'object' || json === null || Array.isArray(json)) {
      return undefined
    }

    const source: SourceLocation = { file: MANIFEST_FILE, adapterId }

    return { json: json as Record<string, unknown>, source, text }
  } catch {
    return undefined
  }
}

/**
 * The range a dependency is declared at, and the field that declared it.
 *
 * The field name travels with the range because the evidence has to name where
 * the reading came from. "vue is around here" is not evidence.
 */
export function declaredRange(
  manifest: Manifest,
  name: string,
): { readonly field: string; readonly range: string } | undefined {
  for (const field of DEPENDENCY_FIELDS) {
    const group = manifest.json[field]

    if (typeof group !== 'object' || group === null || Array.isArray(group)) {
      continue
    }

    const range = (group as Record<string, unknown>)[name]

    if (typeof range === 'string') {
      return { field, range }
    }
  }

  return undefined
}

/** Production dependencies, as declared. Development ones are not project surface. */
export function productionDependencies(
  manifest: Manifest,
): readonly { readonly name: string; readonly range: string }[] {
  const group = manifest.json['dependencies']

  if (typeof group !== 'object' || group === null || Array.isArray(group)) {
    return []
  }

  return Object.entries(group as Record<string, unknown>)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    .map(([name, range]) => ({ name, range }))
    .sort((left, right) => left.name.localeCompare(right.name))
}
