## Why

The current App Graph records literal route information, but the Vue lowering stops at screens and the Workflow IR has no route or deep-link representation. The generated workspace consequently renders imported screens without navigation semantics. Router support is the next required profile increment after the foundation contract is repaired.

## What Changes

- Lower literal Vue Router routes, named parameters and deep links into a framework-neutral route contract.
- Carry navigation actions and route parameters from source to generated output.
- Refuse computed routes, guards, plugins, unresolved components and dynamic route tables without emitting a partial screen.
- Add positive, boundary and refused router fixtures with deterministic workflow hashes.
- Keep route knowledge in the Vue source adapter and the route contract neutral in the Workflow IR.

This change does not add Nuxt, middleware, SSR, authentication or a general router compiler.

## Capabilities

### New Capabilities

- `vue-router-workflow-lowering`: literal Vue Router routes and deep links in the generated workflow profile.

### Modified Capabilities

- `source-vue`: literal route facts and refusals are reported with source locations.
- `app-graph`: route facts remain graph-level and framework-neutral.
- `workflow-ir`: the route and navigation representation is versioned and migratable.

## Impact

- Affects `packages/source-vue`, `packages/graph`, `packages/workflow` and the target-facing route contract.
- Depends on the foundation hardening and the executable action/state contract.
- Requires fresh positive, boundary and refusal fixtures before the change can be archived.
