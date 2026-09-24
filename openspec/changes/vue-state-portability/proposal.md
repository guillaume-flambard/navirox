## Why

The transform pipeline currently has no production migration provider, and the generic planner treats state modules as portable without proving purity, imports or behavior. A Vue state profile must move only approved pure logic and leave every uncertain dependency visible as manual or unknown work.

## What Changes

- Define a Vue-specific evidence gate for pure stores and composables.
- Verify imports, side effects and observable behavior before classifying a unit as shared or portable.
- Move approved units unchanged through the existing migration engine.
- Record unresolved imports, unsupported behavior and manual work in the transform result and manifest.
- Keep Vue-specific policy in the source adapter or a declared Vue planner rule, not in the neutral migration engine.

This change does not claim offline synchronization, persistence, server state or broad application migration.

## Capabilities

### New Capabilities

- `vue-state-portability`: evidence-gated movement of pure Vue state and composable units.

### Modified Capabilities

- `migration-classification`: a parsed state unit is not portable without the declared Vue evidence gate.
- `migration-engine`: moved units and unresolved imports remain traceable and atomic.

## Impact

- Affects `packages/source-vue`, `packages/planner`, `packages/migrate` and the transform production composition.
- Adds no external dependency and moves no unapproved code.
- Requires behavior fixtures and a manifest-level manual-work report.
