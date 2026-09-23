## Context

See `proposal.md` - Why. Today one target (`target-vue`) reads a Vue
single-file component and emits native source, and one source (`source-vue`)
produces the graph. The next step, a lowering seam and a `transform`
orchestrator, needs a contract a second source can produce and a second target
can consume without either naming the other. The product spec fixes the shape
(`Workflow`, `Screen`, `ViewNode`, `Binding`, `Action`, `StateModel`,
`LayoutConstraint`, `StyleToken`, `Resource`, `Coverage`) and the rule that the
IR exists only when at least two lowerings and a target require it.

## Goals / Non-Goals

**Goals:**

- One versioned, framework-neutral IR with exhaustive coverage.
- A stable serialization and hash, so a workflow is comparable run to run.
- Provenance from every node back to its source location.

**Non-Goals:**

- Lowering a framework into the IR (that is the next change,
  `source-transform-provider-seam`).
- Emitting native source from the IR (that is a target's job).
- Modelling animation, gestures or rich text beyond what a first screen needs.

## Decisions

### A new neutral package, `@memolabs-apps/workflow`

The IR is its own package, with no dependency on a source framework, a target
provider or the renderer.

Rejected: adding the IR to `@memolabs-apps/graph`. The graph is an analysis model
that an adapter owns; widening it would make every adapter speak a generation
contract it does not need.

### Coverage gates emission

Every IR node records generated, manual-required, excluded or refused, and a
workflow with an uncovered node is not emittable.

Rejected: an optional coverage field. An absent field is exactly the silent
best-effort the product rules forbid; an incomplete output must be an error.

### A minimal node set, widened only on demand

The node set is the one the product spec names and nothing more; a new concept is
added only when a second provider or a target needs it.

Rejected: an open-ended AST. A universal AST is an explicit non-goal.

### Stable serialization by construction

Serialization writes fields in a fixed declaration order, so the same workflow
always hashes alike.

Rejected: relying on `JSON.stringify` object key order, which is an
implementation detail.

### Contract change questions

This change introduces a new versioned contract of its own (`workflow-ir`), owned
by the neutral package. It changes no existing shared contract: no graph concept,
no existing schema version, no public name of an adapter, target or runtime. It
re-exports nothing provider specific. The need is demonstrated by the next two
changes in the same program, a lowering seam and a target emission, which must
meet without either naming the other.

## Risks / Trade-offs

- The IR could grow into a universal AST -> the node set is closed and a new
  concept needs a second consumer.
- Coverage could be filled in optimistically -> a test asserts that an uncovered
  node blocks validation, and the refused fixture exercises it.
