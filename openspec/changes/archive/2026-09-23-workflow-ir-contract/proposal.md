# workflow-ir-contract

## Why

The source adapters produce an `AppGraph`, a model for analysis. A target
provider needs a model of what a screen must become, and today there is none: the
Vue target compiles a single-file component directly, so a second source
framework or a second renderer has nothing neutral to consume. The program's next
steps, a lowering seam and a `transform` orchestrator, both need one versioned
contract between source and target.

## What Changes

- Add `@memolabs-apps/workflow`, a framework-neutral package holding the Workflow
  IR: `Workflow`, `Screen`, `ViewNode`, `Binding`, `Action`, `StateModel`,
  `LayoutConstraint`, `StyleToken`, `Resource` and `Coverage`.
- Version the IR, and give it a stable serialization, a hash and a provenance
  reference back to the source.
- Require coverage for every node: generated, manual-required, excluded or
  refused. A workflow with an uncovered node cannot be emitted.
- Add fixtures: a serializable positive workflow, a boundary workflow at the
  contract's edge, and a refused incomplete workflow.

## Capabilities

### New Capabilities

- `workflow-ir`: the versioned, framework-neutral interface between a source
  lowering and a target emission, with exhaustive coverage and stable
  serialization.

### Modified Capabilities

None.

## Impact

This adds the neutral package `@memolabs-apps/workflow` and lists it in the root
`tsconfig.json` references. It imports no source framework, no target provider
and no renderer. It changes no existing graph, adapter, target, runtime seam,
public type name or schema version.
