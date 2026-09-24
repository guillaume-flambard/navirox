import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { runCli } from './cli'

/**
 * The Angular neutral seam, driven end to end.
 *
 * The proof is not that a native screen exists. It is that a declared workflow
 * input travels from an immutable Angular source through the adapter and the
 * neutral model into a decision the companion consumes, and that everything the
 * source path did not produce is recorded as manual work.
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const FIXTURE = join(HERE, '..', '..', 'source-angular', 'fixtures', 'record-workflow')
const RECORD = join(
  HERE,
  '..',
  '..',
  '..',
  'docs',
  'evidence',
  'angular-neutral-seam.provenance.json',
)
const CONSUMED_SUBJECT = 'angular:src/app/record-workflow.data.ts:utility:default'

interface Decision {
  readonly subject: string
  readonly classification: string
  readonly reasons: readonly { readonly ruleId: string }[]
  readonly evidence: readonly { readonly kind: string; readonly value: string }[]
}

interface PlanDocument {
  readonly source: { readonly adapterId: string }
  readonly decisions: readonly Decision[]
}

interface InspectDocument {
  readonly source: { readonly adapterId: string }
  readonly graph: {
    readonly units: readonly {
      readonly source: { readonly file: string }
      readonly metadata?: Readonly<Record<string, unknown>>
    }[]
  }
}

interface ProvenanceRecord {
  readonly consumed: {
    readonly subject: string
    readonly classification: string
    readonly rule: string
    readonly evidence: string
  }
  readonly manual: readonly {
    readonly subject: string
    readonly classification: string
    readonly rule: string
    readonly reason: string
  }[]
}

function capture(): {
  readonly lines: string[]
  readonly errors: string[]
  readonly io: { readonly out: (line: string) => void; readonly err: (line: string) => void }
} {
  const lines: string[] = []
  const errors: string[] = []

  return {
    lines,
    errors,
    io: {
      out: (line) => lines.push(line),
      err: (line) => errors.push(line),
    },
  }
}

function record(): ProvenanceRecord {
  return JSON.parse(readFileSync(RECORD, 'utf8')) as ProvenanceRecord
}

function decisionFor(plan: PlanDocument, subject: string): Decision {
  const decision = plan.decisions.find((entry) => entry.subject === subject)

  if (decision === undefined) {
    throw new Error(`The plan decided nothing about ${subject}.`)
  }

  return decision
}

/**
 * The unit the companion consumes. It is the seam in one function: when the
 * plan no longer offers a shared unit for this subject, the proof has nothing to
 * trace and the caller must fail rather than fall back on manual work.
 */
function consumedDecision(plan: PlanDocument): Decision {
  const decision = decisionFor(plan, CONSUMED_SUBJECT)

  if (decision.classification !== 'shared') {
    throw new Error(
      `${CONSUMED_SUBJECT} is ${decision.classification}, so the companion has no shared input to consume.`,
    )
  }

  return decision
}

describe('the Angular neutral seam', () => {
  it('drives the fixture through the real adapter registry and planner', async () => {
    const io = capture()
    const code = await runCli(['plan', '--json'], io.io, FIXTURE)
    const plan = JSON.parse(io.lines.join('\n')) as PlanDocument

    expect(io.errors.join('\n')).toBe('')
    expect(code).toBe(0)
    expect(plan.source.adapterId).toBe('angular')
  }, 30_000)

  it('carries the adapter metadata across the source seam', async () => {
    const io = capture()
    const code = await runCli(['analyze', '--json'], io.io, FIXTURE)
    const report = JSON.parse(io.lines.join('\n')) as InspectDocument
    const unit = report.graph.units.find(
      (entry) => entry.source.file === 'src/app/record-workflow.component.ts',
    )
    const readiness = unit?.metadata?.mobileReadiness as
      { readonly state: string; readonly rule: string } | undefined

    expect(code).toBe(0)
    expect(report.source.adapterId).toBe('angular')
    expect(readiness?.state).toBe('candidate')
    expect(readiness?.rule).toBe('attachment-signal')
  })

  it('consumes the shared unit the planner approved', async () => {
    const io = capture()
    await runCli(['plan', '--json'], io.io, FIXTURE)
    const plan = JSON.parse(io.lines.join('\n')) as PlanDocument
    const decision = consumedDecision(plan)

    expect(decision.reasons[0]?.ruleId).toBe('unit-shared-logic')
    expect(decision.evidence).toContainEqual({
      kind: 'source',
      value: 'src/app/record-workflow.data.ts',
    })
  })

  it('keeps manual native work distinct from the consumed unit', async () => {
    const io = capture()
    await runCli(['plan', '--json'], io.io, FIXTURE)
    const plan = JSON.parse(io.lines.join('\n')) as PlanDocument
    const screen = decisionFor(
      plan,
      'angular:src/app/record-workflow.component.ts:component:default',
    )
    const capability = decisionFor(
      plan,
      'angular:src/app/record-workflow.component.ts:capability:file-reading:read',
    )

    expect(screen.classification).toBe('native-replacement')
    expect(screen.reasons[0]?.ruleId).toBe('unit-view-layer')
    expect(capability.classification).toBe('manual')
    expect(capability.reasons[0]?.ruleId).toBe('capability-no-counterpart')
  })

  it('matches the provenance record it belongs to', async () => {
    const io = capture()
    await runCli(['plan', '--json'], io.io, FIXTURE)
    const plan = JSON.parse(io.lines.join('\n')) as PlanDocument
    const provenance = record()
    const consumed = decisionFor(plan, provenance.consumed.subject)

    expect(provenance.consumed.subject).toBe(CONSUMED_SUBJECT)
    expect(consumed.classification).toBe(provenance.consumed.classification)
    expect(consumed.reasons[0]?.ruleId).toBe(provenance.consumed.rule)
    expect(consumed.evidence).toContainEqual({
      kind: 'source',
      value: provenance.consumed.evidence,
    })

    for (const manual of provenance.manual) {
      const decision = decisionFor(plan, manual.subject)

      expect(decision.classification).toBe(manual.classification)
      expect(decision.reasons[0]?.ruleId).toBe(manual.rule)
      expect(manual.reason.length).toBeGreaterThan(0)
    }
  })

  it('fails when the consumed input is replaced with manual work', async () => {
    const io = capture()
    await runCli(['plan', '--json'], io.io, FIXTURE)
    const plan = JSON.parse(io.lines.join('\n')) as PlanDocument
    const replaced: PlanDocument = {
      ...plan,
      decisions: plan.decisions.map((decision) =>
        decision.subject === CONSUMED_SUBJECT
          ? { ...decision, classification: 'manual' }
          : decision,
      ),
    }

    expect(() => consumedDecision(plan)).not.toThrow()
    expect(() => consumedDecision(replaced)).toThrow(/no shared input to consume/)
  })
})
