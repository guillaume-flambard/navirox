import type { AppGraph, NodeId } from '@memolabs-apps/graph'
import type { CompatibilityRegistry } from '@memolabs-apps/compat'
import { compatibilityEvidence, compatibilityRule } from './compatibility.js'
import {
  CONFIDENCES,
  MIGRATION_CLASSES,
  type Confidence,
  type MigrationClass,
  type MigrationDecision,
} from './classes.js'
import {
  DEPENDENCY_RULE,
  FALLBACK_RULE,
  GENERIC_RULES,
  orderedRules,
  type MigrationRule,
  type RuleContext,
} from './rules.js'

/** The plan schema version. A reader decides it can read a plan with this. */
export const PLAN_SCHEMA_VERSION = 1

/** An override a project supplies, with the reason it was supplied. */
export interface ClassificationOverride {
  /** A path prefix the override matches. */
  readonly match: string
  readonly classification: MigrationClass
  readonly reason: string
}

export interface PlanSummary {
  readonly shared: number
  readonly portable: number
  readonly adaptable: number
  readonly 'native-replacement': number
  readonly 'web-fallback': number
  readonly manual: number
  readonly unknown: number
}

export interface MigrationPlan {
  readonly schemaVersion: number
  readonly source: AppGraph['source']
  readonly decisions: readonly MigrationDecision[]
  /** The nodes the plan could not decide, named separately so the extent is visible. */
  readonly unknowns: readonly NodeId[]
  readonly summary: PlanSummary
}

export interface PlanOptions {
  readonly overrides?: readonly ClassificationOverride[]
  /** Extra rules, which a source adapter or a future target provider contributes. */
  readonly rules?: readonly MigrationRule[]
  /** What is known about compatibility. Loaded by the caller, never read here. */
  readonly compatibility?: CompatibilityRegistry
}

/**
 * The overrides rule layer.
 *
 * An override is a decision the user made about their own project, so it wins over
 * every rule, and it carries the reason the user gave. This is the only place
 * where a classification can arrive from outside the graph, which is why it is a
 * layer rather than a special case inside the loop.
 */
function overrideRule(overrides: readonly ClassificationOverride[]): MigrationRule[] {
  return overrides.map((override) => ({
    id: `override:${override.match}`,
    layer: 'override' as const,
    applies: (context: RuleContext) => {
      const file = context.graph.units.find((unit) => unit.id === context.subject)?.source.file

      return file === undefined ? false : file.startsWith(override.match)
    },
    evaluate: () => ({
      classification: override.classification,
      confidence: 'high' as Confidence,
      message: `A project override classifies this as ${override.classification}: ${override.reason}`,
    }),
  }))
}

/**
 * The rule context for one subject.
 *
 * Exported for the semantic second-opinion layer, which judges the subjects
 * the rules could not decide. Reading a context changes no decision.
 */
export function contextForSubject(graph: AppGraph, subject: NodeId): RuleContext {
  const unit = graph.units.find((node) => node.id === subject)
  const capability = graph.capabilities.find((node) => node.id === subject)

  if (unit !== undefined) {
    const capabilitiesInUnit = graph.edges
      .filter((edge) => edge.from === unit.id && edge.kind === 'uses')
      .map((edge) => graph.capabilities.find((node) => node.id === edge.to)?.capability)
      .filter((name): name is string => name !== undefined)
      .sort()

    return { graph, subject, capabilitiesInUnit, unitKind: unit.kind }
  }

  if (capability !== undefined) {
    return {
      graph,
      subject,
      capabilitiesInUnit: [],
      capability: capability.capability,
      usage: capability.usage,
    }
  }

  const dependency = graph.dependencies.find((node) => node.id === subject)

  if (dependency !== undefined) {
    return { graph, subject, capabilitiesInUnit: [], dependencyName: dependency.name }
  }

  return { graph, subject, capabilitiesInUnit: [] }
}

/** Every subject the plan decides, in a deterministic order. */
function subjects(graph: AppGraph): readonly NodeId[] {
  return [
    ...graph.units.map((node) => node.id),
    ...graph.capabilities.map((node) => node.id),
    ...graph.dependencies.map((node) => node.id),
  ].sort()
}

function evidenceFor(
  graph: AppGraph,
  subject: NodeId,
  options: PlanOptions,
): MigrationDecision['evidence'] {
  const dependency = graph.dependencies.find((node) => node.id === subject)
  const record =
    dependency === undefined
      ? undefined
      : options.compatibility?.lookup({ kind: 'package', name: dependency.name })

  if (record !== undefined) {
    return [...compatibilityEvidence(record)]
  }

  const unit = graph.units.find((node) => node.id === subject)

  if (unit !== undefined) {
    return [{ kind: 'source', value: unit.source.file }]
  }

  const capability = graph.capabilities.find((node) => node.id === subject)

  if (capability !== undefined) {
    return [
      {
        kind: 'source',
        value: `${capability.source.file} ${capability.capability}:${capability.usage}`,
      },
    ]
  }

  const manifestEntry = graph.dependencies.find((node) => node.id === subject)

  return [
    {
      kind: 'manifest',
      value:
        `package.json ${manifestEntry?.name ?? subject} ${manifestEntry?.version ?? ''}`.trim(),
    },
  ]
}

/**
 * Turns a graph into a plan.
 *
 * It reads the graph and nothing else: no filesystem, no project, no network. The
 * whole point of a separate layer is that a caller can plan over a graph from any
 * adapter, or over a graph it built itself, without running an inspection.
 */
export function plan(graph: AppGraph, options: PlanOptions = {}): MigrationPlan {
  const rules = orderedRules([
    ...overrideRule(options.overrides ?? []),
    ...(options.compatibility === undefined ? [] : [compatibilityRule(options.compatibility)]),
    ...GENERIC_RULES,
    DEPENDENCY_RULE,
    ...(options.rules ?? []),
    FALLBACK_RULE,
  ])

  const decided = subjects(graph).flatMap((subject) => {
    const context = contextForSubject(graph, subject)
    const rule = rules.find((candidate) => candidate.applies(context))

    if (rule === undefined) {
      return []
    }

    const decision = rule.evaluate(context)

    return [
      {
        subject,
        classification: decision.classification,
        confidence: decision.confidence,
        reasons: [{ ruleId: rule.id, message: decision.message }],
        evidence: evidenceFor(graph, subject, options),
      } satisfies MigrationDecision,
    ]
  })

  const summary = MIGRATION_CLASSES.reduce<Record<MigrationClass, number>>(
    (counts, classification) => {
      counts[classification] = decided.filter(
        (decision) => decision.classification === classification,
      ).length

      return counts
    },
    {
      shared: 0,
      portable: 0,
      adaptable: 0,
      'native-replacement': 0,
      'web-fallback': 0,
      manual: 0,
      unknown: 0,
    },
  )

  return {
    schemaVersion: PLAN_SCHEMA_VERSION,
    source: graph.source,
    decisions: decided,
    unknowns: decided
      .filter((decision) => decision.classification === 'unknown')
      .map((decision) => decision.subject),
    summary,
  }
}

export { CONFIDENCES, MIGRATION_CLASSES }
