# Workflow evidence

A proof companion can pass a device journey and still solve an unimportant mobile
problem. This document is the record a proof journey fills in before a companion
is implemented, so the workflow it builds is chosen from evidence rather than
from the shape of a source repository.

The program gate that consumes it is P1 in
[`docs/PROOF-ROADMAP.md`](PROOF-ROADMAP.md). One completed record per journey
lives under `docs/evidence/`.

## Validation status rule

Every record states one status in its `Confidence and validation` section, and
that status constrains how the record may be quoted elsewhere.

| Status                   | When it applies                                                                  | What it may be called                                           |
| ------------------------ | -------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `unvalidated hypothesis` | No practitioner feedback was obtained, or feedback was obtained without consent. | A hypothesis. Never customer demand, a user request, or a need. |
| `practitioner-informed`  | Feedback was obtained through the guide below, with consent, and synthesized.    | Informing a hypothesis. Still not customer demand.              |

The rule: an unvalidated workflow hypothesis MUST be labelled as such and MUST NOT
be described as customer demand, a user request, or a validated need. Negative
feedback that rejects a workflow is a valid outcome and is recorded the same way.
No record may claim validation from a public repository's structure, download
count, or issue tracker.

## Boundaries

- Records use reproducible benchmark findings and original synthetic data only.
- A record never contains credentials, customer data, real records, or an implied
  customer relationship.
- A public benchmark revision is an analysis input, never a customer or an
  endorsement.

## Template

Copy the block below into `docs/evidence/<journey>-workflow.md` and complete every
field. A field with no evidence says so; do not leave it blank and do not fill it
with an assumption presented as a fact.

```markdown
# Workflow: <independent name>

## Source provenance

- Benchmark: <name> (<upstream URL>)
- Immutable revision: <full commit SHA>
- Source directory: <path inside the repository>
- Reproducing command: <the exact command>
- Report: <path to the machine readable report under docs/evidence/>

## Actor and mobile context

- Who performs the work: <role, described without naming a customer>
- Where and on what device: <environment and device class>
- Current tool: <how it is done today>

## Trigger

- What starts the workflow: <the observable event or user intent>

## Success state

- The workflow is complete when: <observable end state>
- Bounded data assumptions: <the minimum data and API surface it needs>

## Friction measure

- Friction observable today: <what is slow, costly or error prone, and how it is
  observed>
- How the workflow changes it: <the expected improvement, stated as a claim to
  test rather than a result>
- How it would be measured: <the observable signal a device proof could record>

## Desktop-only remainder

- Stays on the desktop: <the parts deliberately out of scope>
- Why: <the reason>

## Alternative-path comparison

Decision criteria: offline need, device integration, interaction cost,
operational ownership. Write what each path does for this workflow.

| Criterion             | Native companion | PWA | WebView | Capacitor |
| --------------------- | ---------------- | --- | ------- | --------- |
| Offline need          |                  |     |         |           |
| Device integration    |                  |     |         |           |
| Interaction cost      |                  |     |         |           |
| Operational ownership |                  |     |         |           |

- Decision: <native companion, or the named alternative, or stop the native proof>
- Reason: <why that path is the honest recommendation for this workflow>

## Confidence and validation

- Status: <unvalidated hypothesis | practitioner-informed>
- Basis: <what the status rests on>
- If practitioner-informed: <link to the synthesized findings, never a transcript>

## Known unknowns

- <open question that could change the decision>
```

## Practitioner feedback

Feedback is optional evidence, never a prerequisite for reading a public
benchmark. When it is sought it follows
[`docs/OPERATOR-FEEDBACK.md`](OPERATOR-FEEDBACK.md), which also defines how
findings are synthesized. Raw transcripts, names, and contact details stay out of
the repository.
