import { DETECTION_CONFIDENCES, SUPPORT_LEVELS } from './types.js'
import type { DetectionContext, SourceAdapter } from './types.js'

/**
 * The parts of the adapter contract a machine can check.
 *
 * These are the rules that are true for every adapter and cheap to verify, so
 * they are verified once here instead of being reimplemented in each adapter's
 * suite. It is a plain async function rather than a test file so a new adapter
 * can import it and assert against its own implementation.
 *
 * What it cannot check is the interesting half: that unsupported syntax becomes
 * a finding instead of a crash, and that a version outside the tested range is
 * reported. Those need a project to run against, so they stay the adapter's own
 * fixtures. This function is the floor, not the whole contract.
 */
export interface AdapterContractViolation {
  readonly code: string
  readonly detail: string
}

const ADAPTER_ID_PATTERN = /^[a-z][a-z0-9-]*$/

export async function verifyAdapterContract(
  adapter: SourceAdapter,
  context: DetectionContext,
): Promise<readonly AdapterContractViolation[]> {
  const violations: AdapterContractViolation[] = []

  if (!ADAPTER_ID_PATTERN.test(adapter.id)) {
    violations.push({
      code: 'id-shape',
      detail: `The adapter id "${adapter.id}" is not a lowercase machine name.`,
    })
  }

  if (adapter.displayName.trim() === '') {
    violations.push({ code: 'display-name', detail: 'The adapter has no display name.' })
  }

  if (!SUPPORT_LEVELS.includes(adapter.supportLevel)) {
    violations.push({
      code: 'support-level',
      detail: `The support level "${adapter.supportLevel}" is not one of ${SUPPORT_LEVELS.join(', ')}.`,
    })
  }

  if (adapter.testedVersions.length === 0) {
    violations.push({
      code: 'tested-versions',
      detail:
        'The adapter declares no tested version range, so every version would look supported.',
    })
  }

  for (const range of adapter.testedVersions) {
    if (range.framework.trim() === '' || range.versions.length === 0) {
      violations.push({
        code: 'tested-versions',
        detail: 'A tested version range names no framework or lists no versions.',
      })
    }
  }

  const first = await detectOrNull(adapter, context, violations)
  if (first === null) return violations

  const second = await detectOrNull(adapter, context, violations)

  for (const candidate of first.candidates) {
    if (!DETECTION_CONFIDENCES.includes(candidate.confidence)) {
      violations.push({
        code: 'candidate-confidence',
        detail: `A candidate reported confidence "${candidate.confidence}", which is not ${DETECTION_CONFIDENCES.join(', ')}.`,
      })
    }

    if (candidate.evidence.length === 0) {
      violations.push({
        code: 'candidate-evidence',
        detail:
          'A candidate was reported without evidence, so nothing explains why the project matched.',
      })
    }
  }

  if (second !== null && JSON.stringify(first) !== JSON.stringify(second)) {
    violations.push({
      code: 'detect-unstable',
      detail: 'Detection returned a different answer for the same project on a second run.',
    })
  }

  return violations
}

async function detectOrNull(
  adapter: SourceAdapter,
  context: DetectionContext,
  violations: AdapterContractViolation[],
): Promise<Awaited<ReturnType<SourceAdapter['detect']>> | null> {
  try {
    return await adapter.detect(context)
  } catch (error) {
    violations.push({
      code: 'detect-threw',
      detail: `Detection threw on a project it did not recognize: ${String(error)}`,
    })
    return null
  }
}
