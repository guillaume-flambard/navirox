import type { AppGraph, NodeId } from '@memolabs-apps/graph'
import type { EntryType, Questions, TypeSafeClient } from '@typesafe-ai/sdk'
import type { Confidence, MigrationClass } from './classes.js'
import { MIGRATION_CLASSES } from './classes.js'
import type { MigrationPlan } from './plan.js'
import { contextForSubject } from './plan.js'

/**
 * A second opinion for the decisions the rules cannot make.
 *
 * The rule engine stays the decider: `plan()` reads the graph and nothing else,
 * deterministically, with no network. This module only speaks for the subjects
 * the plan left as `manual` or `unknown`, and it only suggests. A suggestion
 * never rewrites a decision, because a judgment the plan cannot explain would
 * break the property classes.ts is built on: every classification says why.
 *
 * Known rules, calculations and exact lookups stay in code. TypeSafe supplies
 * the semantic reading where code has no counterpart to consult: an unknown
 * capability, a dependency with no compatibility record, a unit no rule covers.
 */

// Dependency record: @typesafe-ai/sdk@^0.6.0 is the transport for these
// judgments. On a 0.x version the caret is bounded to this minor line, so it
// tracks patches without floating. It carries the retry and backoff policy the
// HTTP docs prescribe for 429/529, so this module does not hand-roll one. The
// public surface below never exposes SDK types: the judge interface is ours,
// the SDK is imported only when a judgment is actually made, and it stays
// behind createTypeSafeJudge. The version and this reason are also recorded in
// docs/ARCHITECTURE.md.

/** The TypeSafe model that performs the judgments. */
export const SEMANTIC_MODEL = 'jev-latest'

/** The environment variable that carries the TypeSafe API key. Server side only. */
export const TYPESAFE_API_KEY_ENV = 'TYPESAFE_API_KEY'

/**
 * Confidence floors for the model's distribution concentration.
 *
 * These are starting points, not universal rules: a Noul near 0.5 means split
 * probability, and spread options can lower a Choice confidence without making
 * the top pick wrong. Calibrate them against project data and consequences.
 */
export const HIGH_SEMANTIC_CONFIDENCE = 0.8
export const MEDIUM_SEMANTIC_CONFIDENCE = 0.5

/** Thrown when a semantic judgment is requested without an API key. */
export class MissingTypesafeKeyError extends Error {
  constructor() {
    super(
      `Semantic suggestions need a TypeSafe API key. Set ${TYPESAFE_API_KEY_ENV} in the environment and retry without --semantic otherwise.`,
    )
    this.name = 'MissingTypesafeKeyError'
  }
}

/**
 * What each migration class means to the judge.
 *
 * The same closed set the rules decide between: the judge suggests within the
 * plan's vocabulary rather than inventing its own, so a suggestion is directly
 * comparable to the decision it seconds.
 */
const CLASS_RUBRICS: Record<MigrationClass, string> = {
  shared: 'Logic with no platform capability use. Moves unchanged.',
  portable: 'Behaves the same on a native surface. Moves with its shape intact.',
  adaptable: 'Keeps its behaviour and changes its platform call for the native counterpart.',
  'native-replacement':
    'Its role is understood but its implementation must be rewritten for native.',
  'web-fallback': 'Kept as web for now. Not the migration target.',
  manual: 'A person has to decide. None of the other classes fits.',
  unknown: 'There is not enough evidence to choose. Say unknown rather than guess.',
}

/** The narrow state one subject is judged on. Names and kinds only. */
export interface SemanticSubjectState {
  readonly kind: 'unit' | 'capability' | 'dependency' | 'other'
  readonly unitKind?: string
  readonly capability?: string
  readonly usage?: string
  readonly capabilitiesInUnit?: readonly string[]
  readonly dependencyName?: string
  readonly file?: string
}

/** One judgment requested, in the judge's own vocabulary. */
export interface SemanticQuestion {
  readonly instructions: string
  readonly criteria: Record<MigrationClass, string>
}

/** One judgment returned, with its probability distribution. */
export interface SemanticAnswer {
  readonly choice: MigrationClass
  readonly confidence: number
  readonly probabilities: Partial<Record<MigrationClass, number>>
}

/**
 * The semantic judge, behind an interface.
 *
 * The interface is structural and SDK-free so tests inject a fake and no
 * network is ever needed to exercise the mapping. createTypeSafeJudge is the
 * only production implementation.
 */
export interface SemanticJudge {
  judge(
    state: { subjects: readonly SemanticSubjectState[] },
    questions: Record<string, SemanticQuestion>,
  ): Promise<Record<string, SemanticAnswer>>
}

/**
 * The production judge, backed by TypeSafe.
 *
 * The key is explicit or read from the environment once, at construction, and
 * is never logged or returned. The SDK refuses browser runtimes, which matches
 * this module's boundary: judgments run in the toolchain, never in app code.
 */
export function createTypeSafeJudge(
  apiKey: string | undefined = undefined,
  env: NodeJS.ProcessEnv = process.env,
): SemanticJudge {
  const key = apiKey ?? env[TYPESAFE_API_KEY_ENV]

  if (key === undefined || key.trim() === '') {
    throw new MissingTypesafeKeyError()
  }

  // The SDK is imported the first time a judgment is made, never at module
  // scope. `navirox plan` and `navirox migrate` load this module through the
  // planner even without --semantic, and a command that asks no question should
  // not pay for the transport that would carry one.
  let pending: Promise<TypeSafeClient> | undefined
  const client = async (): Promise<TypeSafeClient> => {
    pending ??= import('@typesafe-ai/sdk').then(
      ({ TypeSafeClient: Client }) => new Client({ apiKey: key }),
    )

    return pending
  }

  return {
    async judge(state, questions) {
      const resolved = await client()
      const result = await resolved.systemOne({
        state: state as unknown as EntryType,
        model: SEMANTIC_MODEL,
        questions: asSdkQuestions(questions),
      })
      const answers = result.answers as unknown as Record<string, unknown>
      const mapped: Record<string, SemanticAnswer> = {}

      for (const [id, answer] of Object.entries(answers)) {
        mapped[id] = coerceAnswer(answer)
      }

      return mapped
    },
  }
}

/** A suggestion for one undecided subject. */
export interface SemanticSuggestion {
  readonly subject: NodeId
  readonly suggested: MigrationClass
  readonly confidence: Confidence
  /** The model's raw distribution concentration, kept for calibration. */
  readonly modelConfidence: number
  readonly probabilities: Partial<Record<MigrationClass, number>>
  readonly message: string
  readonly model: string
}

/**
 * Suggests classifications for the subjects the plan could not decide.
 *
 * Only `manual` and `unknown` decisions are submitted, together in one
 * request: they are independent questions over their own states and run in
 * parallel. Decided subjects are never sent. An empty undecided set makes no
 * request at all, so the judge is never paid for nothing.
 */
export async function suggestForUndecided(
  graph: AppGraph,
  plan: MigrationPlan,
  judge: SemanticJudge,
): Promise<readonly SemanticSuggestion[]> {
  const targets = plan.decisions.filter(
    (decision) => decision.classification === 'manual' || decision.classification === 'unknown',
  )

  if (targets.length === 0) {
    return []
  }

  const subjects = targets.map((decision) => stateFor(contextForSubject(graph, decision.subject)))
  const questions: Record<string, SemanticQuestion> = {}

  for (const [index, subject] of subjects.entries()) {
    questions[`q${index}`] = {
      instructions: `Which migration class fits subjects[${index}]? It is a ${describeSubject(subject)}. Include a no-match outcome: answer manual when a person has to decide, unknown when the evidence is too thin.`,
      criteria: Object.fromEntries(
        MIGRATION_CLASSES.map((classification) => [classification, CLASS_RUBRICS[classification]]),
      ) as Record<MigrationClass, string>,
    }
  }

  const answers = await judge.judge({ subjects }, questions)

  return targets.map((decision, index) => {
    const answer = answers[`q${index}`]

    if (answer === undefined || !isMigrationClass(answer.choice)) {
      return {
        subject: decision.subject,
        suggested: 'unknown' as const,
        confidence: 'low' as const,
        modelConfidence: 0,
        probabilities: {},
        message:
          'The semantic judge returned an unusable answer, so there is still no suggestion for this subject.',
        model: SEMANTIC_MODEL,
      } satisfies SemanticSuggestion
    }

    return {
      subject: decision.subject,
      suggested: answer.choice,
      confidence: toConfidence(answer.confidence),
      modelConfidence: answer.confidence,
      probabilities: answer.probabilities,
      message: `TypeSafe suggests ${answer.choice} with model confidence ${answer.confidence.toFixed(2)}. A suggestion, not a decision: confirm it before acting on it.`,
      model: SEMANTIC_MODEL,
    } satisfies SemanticSuggestion
  })
}

/** Renders the suggestions for a person, after the plan's own sections. */
export function renderSemanticSuggestions(suggestions: readonly SemanticSuggestion[]): string {
  const lines: string[] = []

  lines.push('')
  lines.push(`Second opinions (${SEMANTIC_MODEL}, suggestion only)`)
  if (suggestions.length === 0) {
    lines.push('  the plan decided everything, so no judgment was requested')
  } else {
    const ordered = [...suggestions].sort(
      (left, right) =>
        right.modelConfidence - left.modelConfidence || left.subject.localeCompare(right.subject),
    )

    for (const suggestion of ordered) {
      lines.push(
        `  ${suggestion.subject}  -> ${suggestion.suggested} (${suggestion.confidence}, model ${suggestion.modelConfidence.toFixed(2)})`,
      )
    }
  }

  return lines.join('\n')
}

function stateFor(context: ReturnType<typeof contextForSubject>): SemanticSubjectState {
  if (context.unitKind !== undefined) {
    const file = context.graph.units.find((unit) => unit.id === context.subject)?.source.file

    return {
      kind: 'unit',
      unitKind: context.unitKind,
      capabilitiesInUnit: context.capabilitiesInUnit,
      ...(file === undefined ? {} : { file }),
    }
  }

  if (context.capability !== undefined) {
    return {
      kind: 'capability',
      capability: context.capability,
      ...(context.usage === undefined ? {} : { usage: context.usage }),
    }
  }

  if (context.dependencyName !== undefined) {
    return { kind: 'dependency', dependencyName: context.dependencyName }
  }

  return { kind: 'other' }
}

function describeSubject(subject: SemanticSubjectState): string {
  switch (subject.kind) {
    case 'unit':
      return `unit of kind ${subject.unitKind ?? 'unknown'}${unitCapabilities(subject)}`
    case 'capability':
      return `capability ${subject.capability ?? 'unknown'} used as ${subject.usage ?? 'unknown'}`
    case 'dependency':
      return `dependency ${subject.dependencyName ?? 'unknown'}`
    case 'other':
      return 'graph node with no unit, capability or dependency attached'
  }
}

function unitCapabilities(subject: SemanticSubjectState): string {
  if (subject.capabilitiesInUnit === undefined || subject.capabilitiesInUnit.length === 0) {
    return ' with no platform capability use'
  }

  return ` reaching ${subject.capabilitiesInUnit.join(', ')}`
}

function toConfidence(modelConfidence: number): Confidence {
  if (modelConfidence >= HIGH_SEMANTIC_CONFIDENCE) {
    return 'high'
  }

  if (modelConfidence >= MEDIUM_SEMANTIC_CONFIDENCE) {
    return 'medium'
  }

  return 'low'
}

function isMigrationClass(value: unknown): value is MigrationClass {
  return typeof value === 'string' && (MIGRATION_CLASSES as readonly string[]).includes(value)
}

/**
 * Translates our questions into the SDK's shape.
 *
 * The SDK wants a discriminated union of question objects; the judge interface
 * carries the meaning only. This is the one place the two vocabularies meet.
 */
function asSdkQuestions(questions: Record<string, SemanticQuestion>): Questions {
  return Object.fromEntries(
    Object.entries(questions).map(([id, question]) => [
      id,
      {
        type: 'choice' as const,
        instructions: question.instructions,
        criteria: question.criteria,
      },
    ]),
  )
}

function coerceAnswer(answer: unknown): SemanticAnswer {
  if (typeof answer !== 'object' || answer === null) {
    return { choice: 'unknown', confidence: 0, probabilities: {} }
  }

  const record = answer as Record<string, unknown>
  const choice = isMigrationClass(record['choice']) ? record['choice'] : 'unknown'
  const confidence = typeof record['confidence'] === 'number' ? record['confidence'] : 0
  const probabilities =
    typeof record['probabilities'] === 'object' && record['probabilities'] !== null
      ? (record['probabilities'] as Partial<Record<MigrationClass, number>>)
      : {}

  return { choice, confidence, probabilities }
}
