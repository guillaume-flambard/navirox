import type { CompatibilityRecord, CompatibilityRegistry } from '@navirox/compat'
import type { MigrationClass } from './classes.js'
import type { MigrationRule, RuleDecision } from './rules.js'

/**
 * The compatibility rule.
 *
 * It sits in the layer reserved for facts that come from outside the graph, and it
 * produces a decision only for a subject the registry actually holds. Everything
 * else falls through to the generic rules and, for a dependency, to the unknown
 * that says no record exists. The rule cannot invent a verdict, because its
 * `applies` is the lookup.
 */

/** What a status means for a migration decision. */
const CLASS_BY_STATUS: Record<CompatibilityRecord['status'], MigrationClass> = {
  supported: 'portable',
  'supported-with-adapter': 'adaptable',
  partial: 'manual',
  blocked: 'manual',
  unknown: 'unknown',
  'not-applicable': 'shared',
}

const MESSAGE: Record<CompatibilityRecord['status'], string> = {
  supported:
    'A compatibility record says this works on a native target, at the evidence level named below.',
  'supported-with-adapter':
    'A compatibility record says this works on a native target through an adapter, at the evidence level named below.',
  partial:
    'A compatibility record says this works only in part, so a person has to decide what that means for this project.',
  blocked:
    'A compatibility record blocks this on a native target, so a person has to decide what replaces it.',
  unknown:
    'A compatibility record exists and does not know, which is not the same as having no record.',
  'not-applicable':
    'This is part of the native side rather than something a project migrates, so it stays as it is.',
}

export function compatibilityRule(registry: CompatibilityRegistry): MigrationRule {
  return {
    id: 'compatibility-record',
    layer: 'compatibility',
    applies: (context) =>
      context.dependencyName !== undefined &&
      registry.has({ kind: 'package', name: context.dependencyName }),
    evaluate: (context): RuleDecision => {
      const record = registry.lookup({ kind: 'package', name: context.dependencyName ?? '' })

      // Unreachable when `applies` held, and stated rather than asserted so the
      // rule stays a total function.
      if (record === undefined) {
        return {
          classification: 'unknown',
          confidence: 'low',
          message: 'No compatibility record was found after all.',
        }
      }

      return {
        classification: CLASS_BY_STATUS[record.status],
        confidence: record.status === 'unknown' ? 'low' : 'high',
        message: `${MESSAGE[record.status]} ${record.notes}`,
      }
    },
  }
}

/** The evidence a compatibility decision carries, so the level travels with it. */
export function compatibilityEvidence(record: CompatibilityRecord): {
  readonly kind: 'compat-registry'
  readonly value: string
}[] {
  return record.evidence.map((evidence) => ({
    kind: 'compat-registry' as const,
    value: `${record.status} ${evidence.level} ${evidence.source}`,
  }))
}
