import { declaredMajor, testedMajors } from './versions.js'

/**
 * The neutral version gate.
 *
 * A declared npm range is never a compatibility claim on its own. This gate
 * decides whether a declared range falls inside the verified ranges a matrix
 * row grants an adapter, and it builds the deterministic refusal when it does
 * not. It is neutral on purpose: it knows majors and ranges, never a
 * framework, so every adapter and the inspection pipeline can share it.
 *
 * The refusal names the fact, its location, the expected profile and a
 * resumption path, and nothing is generated alongside it.
 */

export interface VersionGateInput {
  readonly adapterId: string
  readonly profile: string
  readonly framework: string
  readonly verifiedVersions: readonly string[]
  /** The range the project declares, or undefined when none could be read. */
  readonly declaredRange: string | undefined
  /** Where the declared range was read from, e.g. `package.json`. */
  readonly location: string
}

export interface VersionRefusal {
  readonly code: 'outside-verified-range'
  /** What was found, e.g. `vue ^4.0.0`. */
  readonly fact: string
  readonly location: string
  readonly expectedProfile: string
  readonly verifiedVersions: readonly string[]
  readonly resumption: string
}

export type VersionGateOutcome =
  { readonly ok: true } | { readonly ok: false; readonly refusal: VersionRefusal }

/**
 * Checks a declared range against verified ranges.
 *
 * A declared range with no readable major is not a refusal: "nothing could be
 * established" is an adapter finding, not a version verdict. Everything else
 * outside the verified majors is refused deterministically.
 */
export function checkVerifiedRange(input: VersionGateInput): VersionGateOutcome {
  if (input.declaredRange === undefined) {
    return { ok: true }
  }

  const major = declaredMajor(input.declaredRange)

  if (major === undefined) {
    return { ok: true }
  }

  if (testedMajors(input.verifiedVersions).includes(major)) {
    return { ok: true }
  }

  return {
    ok: false,
    refusal: {
      code: 'outside-verified-range',
      fact: `${input.framework} ${input.declaredRange}`,
      location: input.location,
      expectedProfile: input.profile,
      verifiedVersions: input.verifiedVersions,
      resumption:
        `Pin ${input.framework} to one of ${input.verifiedVersions.join(', ')} ` +
        `for the ${input.profile} profile, or open a requalification for major ${major} ` +
        `before transforming.`,
    },
  }
}

export interface AdapterVersionSources {
  /** The ranges the matrix grants this adapter, possibly empty. */
  readonly matrixRanges: readonly string[]
  /** The ranges the adapter declares itself, used only when the matrix is silent. */
  readonly fallbackRanges: readonly string[]
}

/**
 * Resolves the ranges an adapter checks a project against.
 *
 * The matrix wins whenever it speaks: a hard-coded adapter constant is a
 * fallback for adapters the matrix does not govern yet, never an override.
 */
export function resolveAdapterVersions(sources: AdapterVersionSources): readonly string[] {
  return sources.matrixRanges.length > 0 ? sources.matrixRanges : sources.fallbackRanges
}
