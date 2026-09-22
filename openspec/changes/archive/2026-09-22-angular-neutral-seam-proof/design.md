# Design: Angular neutral seam proof

## Decision

The Angular proof must preserve a traceable chain: immutable source input,
`source-angular` inspection, neutral App Graph and migration plan, declared
workflow selection, and companion use of the permitted portable/shared output or
neutral decision. The chain need not generate a native screen from Angular
templates. Any native replacement remains manual work and must be reported.

The proof will extend existing seam checks rather than create Angular knowledge
in graph, inspect, migrate, target, or runtime packages. It must name the exact
neutral record or migrated unit the companion consumes so "uses the model" is
observable.

## Alternatives considered

- Accept an independently hand-written Angular-themed app: rejected because it
  cannot prove source-framework neutrality.
- Require full Angular template compilation: rejected because it would expand a
  bounded companion proof into a generic target-compiler program.
- Place Angular-specific workflow logic in the neutral planner: rejected because
  it violates the source seam and makes a second adapter harder rather than
  easier.

## Contract change

No new shared model is assumed. If implementation shows the existing neutral
records cannot express the necessary provenance, stop and create a separate
shared-contract proposal that answers the repository's four contract-change
questions before altering a schema.
