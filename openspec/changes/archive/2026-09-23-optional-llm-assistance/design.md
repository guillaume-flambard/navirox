## Context

See `proposal.md` - Why. The suggestion path already exists in
`@memolabs-apps/planner` (`suggestForUndecided`, `createTypeSafeJudge`) and is
surfaced by `navirox plan --semantic` in `@memolabs-apps/cli`. The rule engine
(`plan()`) reads only the graph, deterministically, with no network; the
suggestion module speaks only for the subjects the plan left `manual` or
`unknown`. This change declares that behaviour as a capability and closes the
verification gap; it does not add a second source of decisions.

## Goals / Non-Goals

**Goals:**

- State the opt-in suggestion contract as observable behaviour.
- Keep the provider behind an injected judge seam so the behaviour is exercised
  without a network.
- Make the "a suggestion never changes a decision" guarantee explicit and
  tested.
- Record the `@typesafe-ai/sdk` dependency and the reason it exists.

**Non-Goals:**

- Any assistant that decides compatibility, portability or support level.
- Explaining reports, proposing a workflow, or drafting scaffolding and TODOs.
  The contract permits these later; none is implemented here.
- Uploading source content, adding a package, a public type or a schema version.

## Decisions

### The judge is an injected seam; the provider is an implementation detail

The `SemanticJudge` interface is structural and SDK-free, and
`createTypeSafeJudge` is the only production implementation. The SDK is imported
lazily, the first time a judgment is made, so a run without `--semantic` reads no
key, makes no request and pays for no transport. Tests inject a fake judge.

Rejected: calling the provider from the plan command directly, which is
untestable without a network and would leak the provider into the CLI. Rejected:
a concrete provider type in the public surface, which would re-export a
provider-specific name through a public `@memolabs-apps/*` package, forbidden by
the hard architectural rules.

### The plan's closed class set is the validation

The judge answers within the plan's `MIGRATION_CLASSES` set and every answer is
coerced against it: an answer outside the set is reported as `unknown` rather
than accepted. A suggestion is therefore directly comparable to the decision it
seconds, and the validation is deterministic code rather than a second model
call.

Rejected: free-text classification, which is uncomparable and unbounded.
Rejected: trusting the provider's own label, which would let the model decide and
violate the preview's policy.

### A suggestion is a separate output, never a mutation

Suggestions are returned beside the plan, under a separate JSON field and a
"Second opinions" section in text, and never rewrite `plan.decisions`. Every
classification in `classes.ts` says why, and a judgment the plan cannot explain
would break that property.

Rejected: writing a suggestion into the decision with a lower confidence, which
would make an unexplainable classification look like a decision.

### Only names and kinds are submitted

The submitted state holds identifiers and kinds (kind, unit kind, capability,
usage, capabilities in a unit, dependency name, file) and no content. The
contract requires no source upload, and a judgment about a kind does not need the
file body.

Rejected: sending file contents for a better read, which uploads source and
breaks the no-upload boundary.

### Contract change questions

This change does not change a shared contract. No graph concept is added, no
schema version moves, no public `@memolabs-apps/*` type name is added or
re-exported, and no source adapter or target provider is touched. The capability
is declared in the framework-neutral planner, which already reads only the graph
and the plan, with the provider behind an interface the planner owns. Adapter
metadata is irrelevant here because whether to suggest depends on the plan's
undecided subjects, not on what an adapter declares.

## Risks / Trade-offs

- A suggestion could be mistaken for a decision -> the label, the separate output
  field and the "never changes a decision" requirement keep them apart.
- Provider availability and cost -> opt-in removes them: with no flag there is no
  key read, no import and no request, and an empty undecided set makes no request
  at all.
- The confidence floors are a starting point, not a universal rule -> they are
  documented as calibratable and the raw model confidence is retained for
  calibration.
- The capability could be read as promising more than it proves -> the spec is
  scoped to the suggestion path and the other LLM roles are listed as non-goals.
