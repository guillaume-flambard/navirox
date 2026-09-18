import type { AppGraph, NodeId } from '@navirox/graph'
import type { Confidence, MigrationClass } from './classes.js'

/**
 * The rule engine.
 *
 * Rules are data, each carrying the layer it belongs to, and the engine sorts by
 * layer before it applies anything. Order of registration therefore cannot change
 * an outcome, which is the same property the adapter registry was built with and
 * for the same reason: a result that depends on load order is a bug that shows up
 * as a mystery.
 */

/**
 * Where a rule sits in the precedence order. Lower wins.
 *
 * The layers are declared rather than numbered at each call site so that adding a
 * layer is a deliberate act with a name.
 */
export const RULE_LAYERS = [
  'override',
  'compatibility',
  'target',
  'source',
  'generic',
  'fallback',
] as const

export type RuleLayer = (typeof RULE_LAYERS)[number]

/** What a rule is allowed to look at: the graph, and the node in question. */
export interface RuleContext {
  readonly graph: AppGraph
  readonly subject: NodeId
  /** The capability names used in the file this subject lives in, if it is a unit. */
  readonly capabilitiesInUnit: readonly string[]
  /** The capability name, when the subject is a capability node. */
  readonly capability?: string
  /** The usage kind, when the subject is a capability node. */
  readonly usage?: string
  /** The unit kind, when the subject is a unit node. */
  readonly unitKind?: string
  /** The dependency name, when the subject is a dependency node. */
  readonly dependencyName?: string
}

/** A decision a rule wants to make, without the parts the engine fills in. */
export interface RuleDecision {
  readonly classification: MigrationClass
  readonly confidence: Confidence
  readonly message: string
}

export interface MigrationRule {
  readonly id: string
  readonly layer: RuleLayer
  readonly applies: (context: RuleContext) => boolean
  readonly evaluate: (context: RuleContext) => RuleDecision
}

/**
 * Capabilities with a counterpart in the native surface.
 *
 * These are the rules the plan is worth reading for: a part that only touches one
 * of these can keep its behaviour and change its implementation, which is the
 * best outcome the product offers short of code that moves unchanged.
 */
const ADAPTABLE_CAPABILITIES: readonly string[] = [
  'local-storage',
  'session-storage',
  'geolocation',
  'clipboard',
  'share',
  'notifications',
  'permissions',
  'network-state',
  'media-capture',
  'media-query',
  'observers',
  'url-navigation',
]

/** Capabilities whose role is understood and whose implementation cannot be reused. */
const NATIVE_REPLACEMENT_CAPABILITIES: readonly string[] = ['canvas', 'animation-frame']

/** Capabilities that behave the same on both sides, so the call moves with its code. */
const PORTABLE_CAPABILITIES: readonly string[] = ['timers', 'network-request']

/** Unit kinds that are logic rather than presentation. */
const LOGIC_UNIT_KINDS: readonly string[] = ['domain-module', 'utility', 'data-client', 'asset']

/** Unit kinds that are the view layer, which the blueprint says is rewritten. */
const VIEW_UNIT_KINDS: readonly string[] = ['screen', 'component', 'layout']

export const GENERIC_RULES: readonly MigrationRule[] = [
  {
    id: 'capability-adaptable',
    layer: 'generic',
    applies: (context) =>
      context.capability !== undefined && ADAPTABLE_CAPABILITIES.includes(context.capability),
    evaluate: (context) => ({
      classification: 'adaptable',
      confidence: 'high',
      message: `${context.capability} has a counterpart in the native capability surface, so the behaviour can be kept and the implementation replaced.`,
    }),
  },
  {
    id: 'capability-native-replacement',
    layer: 'generic',
    applies: (context) =>
      context.capability !== undefined &&
      NATIVE_REPLACEMENT_CAPABILITIES.includes(context.capability),
    evaluate: (context) => ({
      classification: 'native-replacement',
      confidence: 'medium',
      message: `${context.capability} is a rendering concern whose role is understood but whose implementation cannot be reused on a native surface.`,
    }),
  },
  {
    id: 'capability-portable',
    layer: 'generic',
    applies: (context) =>
      context.capability !== undefined && PORTABLE_CAPABILITIES.includes(context.capability),
    evaluate: (context) => ({
      classification: 'portable',
      confidence: 'medium',
      message: `${context.capability} behaves the same on a native surface, so the call moves with its surrounding code.`,
    }),
  },
  {
    id: 'capability-no-counterpart',
    layer: 'generic',
    applies: (context) =>
      context.capability !== undefined &&
      !ADAPTABLE_CAPABILITIES.includes(context.capability) &&
      !NATIVE_REPLACEMENT_CAPABILITIES.includes(context.capability) &&
      !PORTABLE_CAPABILITIES.includes(context.capability),
    evaluate: (context) => ({
      classification: 'manual',
      confidence: 'medium',
      message:
        context.usage === 'unknown'
          ? `This adapter knows of ${context.capability} but no counterpart for it, and the reading could not establish what it is used for, so a person has to decide.`
          : `No counterpart is known for ${context.capability}, so a person has to decide how it moves.`,
    }),
  },
  {
    id: 'unit-shared-logic',
    layer: 'generic',
    applies: (context) =>
      context.unitKind !== undefined &&
      LOGIC_UNIT_KINDS.includes(context.unitKind) &&
      context.capabilitiesInUnit.length === 0,
    evaluate: () => ({
      classification: 'shared',
      confidence: 'high',
      message:
        'This is logic with no platform capability use, so it moves without changing its behaviour.',
    }),
  },
  {
    id: 'unit-state-module',
    layer: 'generic',
    applies: (context) => context.unitKind === 'state-module',
    evaluate: () => ({
      classification: 'portable',
      confidence: 'medium',
      message: 'State lives behind the runtime seam, so a store moves with its shape intact.',
    }),
  },
  {
    id: 'unit-view-layer',
    layer: 'generic',
    applies: (context) =>
      context.unitKind !== undefined && VIEW_UNIT_KINDS.includes(context.unitKind),
    evaluate: () => ({
      classification: 'native-replacement',
      confidence: 'high',
      message:
        'The view layer is rewritten: what carries over is the behaviour behind it, not the markup.',
    }),
  },
  {
    id: 'unit-capability-bearing-logic',
    layer: 'generic',
    applies: (context) =>
      context.unitKind !== undefined &&
      LOGIC_UNIT_KINDS.includes(context.unitKind) &&
      context.capabilitiesInUnit.length > 0,
    evaluate: (context) => ({
      classification: 'adaptable',
      confidence: 'medium',
      message: `This is logic that reaches a platform capability (${context.capabilitiesInUnit.join(', ')}), so the behaviour moves and the capability call is replaced.`,
    }),
  },
]

/**
 * A dependency has no verdict until a compatibility registry exists.
 *
 * The rule exists so the plan can say that explicitly rather than staying silent,
 * which would look like a gap in the graph instead of a gap in the facts.
 */
export const DEPENDENCY_RULE: MigrationRule = {
  id: 'dependency-compatibility-unknown',
  layer: 'generic',
  applies: (context) =>
    context.capability === undefined &&
    context.unitKind === undefined &&
    context.dependencyName !== undefined,
  evaluate: () => ({
    classification: 'unknown',
    confidence: 'low',
    message:
      'Whether this dependency works on a native surface needs a compatibility record, which does not exist yet.',
  }),
}

/**
 * The last rule, which always applies.
 *
 * It exists so that every subject receives a decision rather than nothing. A node
 * silently missing from a plan reads like a gap in the graph instead of a gap in
 * the knowledge, and the difference matters to whoever has to act on the plan.
 */
export const FALLBACK_RULE: MigrationRule = {
  id: 'no-rule-applies',
  layer: 'fallback',
  applies: () => true,
  evaluate: () => ({
    classification: 'unknown',
    confidence: 'low',
    message: 'No rule covers this yet, so Navirox has no answer for it.',
  }),
}

export function orderedRules(rules: readonly MigrationRule[]): readonly MigrationRule[] {
  return [...rules].sort(
    (left, right) =>
      RULE_LAYERS.indexOf(left.layer) - RULE_LAYERS.indexOf(right.layer) ||
      left.id.localeCompare(right.id),
  )
}
