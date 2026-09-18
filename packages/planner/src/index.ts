/** Canonical npm name of this package. Kept in code so the import boundary
 *  checks can assert against it without reading package.json. */
export const PACKAGE_NAME = '@navirox/planner'

/** One line describing this package's role in the Navirox stack. */
export const PACKAGE_ROLE =
  'The migration decision model, the rule engine and the generic rules that turn an App Graph into a plan.'

export { CONFIDENCES, MIGRATION_CLASSES } from './classes.js'
export type { Confidence, DecisionReason, MigrationClass, MigrationDecision } from './classes.js'
export {
  DEPENDENCY_RULE,
  FALLBACK_RULE,
  GENERIC_RULES,
  RULE_LAYERS,
  orderedRules,
} from './rules.js'
export type { MigrationRule, RuleContext, RuleDecision, RuleLayer } from './rules.js'
export type { AppGraph, AppGraphFragment } from '@navirox/graph'
export { compatibilityEvidence, compatibilityRule } from './compatibility.js'
export { PLAN_SCHEMA_VERSION, plan } from './plan.js'
export { planToJson, renderPlan } from './render.js'
export type { ClassificationOverride, MigrationPlan, PlanOptions, PlanSummary } from './plan.js'
