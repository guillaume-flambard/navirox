## Why

The merged Vue T2 path has a review-visible contract gap: the CLI contains framework-specific workspace code, the target package still declares a forbidden source dependency, literal text is serialized as an expression, and the T2 spec contradicts the product rule that incomplete output is not written. These defects must be resolved before router, state or style profiles can build on the seam.

## What Changes

- Make mixed lowering results all-or-nothing: any refused, manual-required or excluded screen returns `ok=false` and blocks every workspace write.
- Give Workflow bindings an explicit literal or expression value kind, with a versioned serialization and migration decision.
- Remove the target package's dependency and project reference on the source-side seam package.
- Move framework-specific workspace construction behind a provider seam so the neutral CLI composition contains no source-framework knowledge.
- Keep the generated workspace's reproduction commands limited to commands the generated package actually exposes.
- Reconcile the T2 evidence and backlog with the strict refusal contract before the next Vue profile change is implemented.

This change does not claim behavioral T3, native device execution or visual fidelity.

## Capabilities

### New Capabilities

- `vue-transform-foundation-hardening`: the bounded contract repairs required before the next Vue profiles.

### Modified Capabilities

- `workflow-ir`: binding values distinguish literals from expressions and schema migration is explicit.
- `transform-orchestrator`: incomplete lowering or emission results are refused atomically before writing, and production composition consumes declared providers.
- `source-transform-provider-seam`: framework-specific workspace construction stays behind the provider boundary, and target package dependency direction is enforceable at the package metadata boundary.

## Impact

- Affects the neutral Workflow IR, the CLI transform boundary, the target package metadata and the Vue T2 evidence.
- Adds schema and behavior deltas; no external dependency is added.
- Existing fake-provider tests remain injectable, but the delivered CLI and boundary tests become the acceptance gate.
