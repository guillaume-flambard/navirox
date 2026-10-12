import type { Evidence } from '@memolabs-apps/graph'
import type { MigrationRule, RuleContext, RuleDecision } from '@memolabs-apps/planner'
import type { StatePortabilityEvidence } from './state-portability.js'

function stateEvidence(context: RuleContext): StatePortabilityEvidence | undefined {
  const unit = context.graph.units.find((candidate) => candidate.id === context.subject)
  return unit?.metadata?.statePortability as StatePortabilityEvidence | undefined
}

function stateMessage(evidence: StatePortabilityEvidence): string {
  if (evidence.status === 'approved') {
    return `Vue state evidence approves this as a portable candidate; behavior fixture ${evidence.fixture.id} is ${evidence.fixture.status}.`
  }

  const refusal = evidence.blockers.join('; ')
  return `Vue state evidence requires ${evidence.status} handling: ${refusal || 'the declared state evidence is not approved'}.`
}

function stateClassification(evidence: StatePortabilityEvidence): RuleDecision['classification'] {
  if (evidence.status === 'approved') {
    return 'portable'
  }

  return evidence.status === 'manual' ? 'manual' : 'unknown'
}

function stateEvidenceEntries(evidence: StatePortabilityEvidence): readonly Evidence[] {
  return [
    { kind: 'source', value: `framework profile ${evidence.profile}` },
    {
      kind: 'fixture',
      value: `behavior fixture ${evidence.fixture.id} ${evidence.fixture.status} ${evidence.fixture.sourceHash}`,
    },
  ]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasStatePortability(context: RuleContext): boolean {
  const metadata = context.graph.units.find((unit) => unit.id === context.subject)?.metadata
  return (
    metadata !== undefined && Object.prototype.hasOwnProperty.call(metadata, 'statePortability')
  )
}

export function createVueStateBehaviorVerificationGuardRule(): MigrationRule {
  return {
    id: 'vue-state-behavior-verification-guard',
    layer: 'source',
    applies: hasStatePortability,
    evaluate: (context): RuleDecision => {
      const metadata = context.graph.units.find((unit) => unit.id === context.subject)?.metadata
      const value = metadata?.['statePortability']
      const evidence = isRecord(value) ? value : undefined
      const profile = isRecord(evidence) ? evidence['profile'] : undefined
      const profileName =
        profile === 'pinia-setup' || profile === 'composable-pure' ? profile : 'unknown'

      return {
        classification: 'unknown',
        confidence: 'high',
        message: `Vue ${profileName} state cannot be moved by the neutral migration engine because a source-owned behavior verifier is required.`,
        evidence: [{ kind: 'source', value: `framework profile ${profileName}` }],
        blockers: ['behavior-verifier-required'],
      }
    },
  }
}

export function createVueStatePortabilityRule(): MigrationRule {
  return {
    id: 'vue-state-portability',
    layer: 'source',
    applies: (context) =>
      context.graph.units.some(
        (unit) => unit.id === context.subject && unit.metadata?.statePortability !== undefined,
      ),
    evaluate: (context): RuleDecision => {
      const evidence = stateEvidence(context)

      if (evidence === undefined) {
        return {
          classification: 'unknown',
          confidence: 'low',
          message: 'Vue state evidence disappeared before the rule could evaluate it.',
        }
      }

      return {
        classification: stateClassification(evidence),
        confidence: evidence.status === 'unknown' ? 'low' : 'high',
        message: stateMessage(evidence),
        evidence: stateEvidenceEntries(evidence),
        blockers: [...evidence.blockers],
      }
    },
  }
}
