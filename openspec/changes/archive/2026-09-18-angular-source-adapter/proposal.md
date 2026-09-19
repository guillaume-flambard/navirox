## Why

Three adapters exist and all three are component frameworks with a similar
reactivity model. A model that only survives Vue, Nuxt, Svelte and SvelteKit is a
model that has been tested four times against the same shape of problem. Angular
is the first source that is genuinely different: dependency injection rather than
imports, decorators rather than a compiler's own file format, a class based service
layer, and a router configured in TypeScript rather than by a directory.

This is the test the cross-adapter gate was built for, applied to a framework that
disagrees with the previous four about how an application is assembled.

## What Changes

- Add `@memolabs-apps/source-angular`: detection, component and service discovery through
  decorators, the shared capability scan, dependencies, findings for the constructs
  it does not model, and the top level routes a routes file states.
- Add the mirrored Angular fixture: the same journey as the Vue and Svelte
  fixtures, so the gate can compare a genuinely different framework against them.
- Extend the cross-adapter gate to the Angular fixture, and record whether the
  neutral model needed anything new to accommodate it.

## Capabilities

### New Capabilities

- `source-angular`

### Modified Capabilities

- None

## Impact

- New package: `packages/source-angular`.
- `packages/cli`: one line at the composition root.
- `packages/source-sveltekit`-style routes: none, this adapter reads them itself.
- Root `tsconfig.json`, `pnpm-lock.yaml`, `README.md`, `docs/evidence/`.
- Not touched: the other adapters, the pipeline, the planner, the engine, the
  runtime packages, the acceptance app, the CI workflows.
- Out of scope: NgModules, nested route children, `loadChildren` resolution,
  template parsing beyond detecting whether a template is inline, signals and RxJS
  semantics, Angular Material, and any migration transform.
