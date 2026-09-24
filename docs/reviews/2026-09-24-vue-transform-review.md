# Vue T2 Review

**Date:** 2026-09-24

## Scope

The review covered the delivered Vue transform path and its evidence against `origin/main` at `df9618b`. The reviewed local changes were `abad954` and the merge tree `999ed6d`.

The review checked the source seam, target seam, transform atomicity, generated workspace claims, migration classification, route and action boundaries, documentation consistency, and the evidence needed before T3.

## Result

The delivered path is useful and reproducible as a bounded compiler-backed Vue workspace proof. It is not yet a behavioral native proof, and the review identified hardening work that must happen before the next Vue profile changes are implemented.

The review does not claim:

- native iOS or Android execution;
- behavioral device journeys;
- visual fidelity;
- general framework support;
- broad source compatibility;
- public installation.

## Blocking findings

### Framework knowledge in a neutral package

`packages/cli/src/vue-workspace.ts` contains Vue-specific construction and vocabulary. This crosses the source seam because the CLI is not a source adapter or source framework package. The boundary is not removed by disguising framework names as strings.

Required disposition: move Vue workspace construction behind the source-transform seam or a declared provider interface, and add a static boundary check.

### Target metadata still depends on the source side

`packages/target-native/package.json` and `packages/target-native/tsconfig.json` still name `@memolabs-apps/source`. The target-side contracts belong to `@memolabs-apps/workflow`; the source package must not be a target dependency or project reference.

Required disposition: remove the dependency and reference, then add a package-metadata boundary test.

### Backlog contradicted the delivered path

The historical backlog text still stated that Vue had no lowering and that the CLI used fake providers. That text is now explicitly historical, and the current status identifies the five active planning changes and the bounded proof.

Required disposition: keep the current status synchronized whenever a change is completed, archived, or opened.

## Correctness findings

### Literal text could be rendered as an expression

The lowering used a primitive string for text bindings, and the target rendered the value through expression syntax. A literal such as `Hello world` could therefore be emitted as an invalid expression instead of literal text.

Required disposition: make literal and expression bindings distinct in the Workflow IR and add a literal-text regression fixture.

### Mixed refusal semantics contradicted the product contract

The previous specification allowed a run to emit generated screens while refusing other screens. The product charter requires all-or-nothing behavior: any non-generated coverage blocks the write and returns `ok=false`.

Required disposition: the five new changes encode the strict behavior. Implementation must make the transform and workspace writer atomic across all findings.

### Generated manifest overclaimed available commands

The generated manifest named native `navirox build ios` and `navirox build android` commands that the generated package did not expose. The workspace only had compiler-backed Vue verification.

Required disposition: list reproduction commands only when they are executable, or record the command as unavailable.

### Action behavior was not proven

Generated event references could name a handler such as `save` without a proven handler definition. T3 action behavior cannot be claimed from compilation alone.

Required disposition: implement the bounded action/state contract and behavior fixtures before opening a device journey.

## Judgment calls

- The target package currently emits Vue SFC output. That is acceptable only as a bounded target profile, not as evidence that the target is framework-neutral or suitable for a native shell.
- The source adapter is the correct location for Vue syntax and Vue Router policy. The neutral workflow and target contracts should remain provider-neutral.
- One commit containing several concerns made the review harder to isolate. Future changes should keep the foundation, action/state, router, state-portability, and style concerns separate.

## Planning artifacts created

The following changes are now complete as planning artifacts and validate strictly:

- `vue-transform-foundation-hardening`
- `vue-action-state-execution`
- `vue-router-workflow-lowering`
- `vue-state-portability`
- `vue-native-style-profile`

`vue-transform-foundation-hardening` is now implemented and verified on the feature branch. The other four changes remain unimplemented planning artifacts. The next implementation order is:

1. implement bounded action and state execution;
2. lower literal routes and route-linked navigation;
3. move only evidence-approved state and composable units;
4. add the named native style profile and refusal coverage.

T3 and T4 remain gated until those changes have task-level evidence and the required tests and clean builds.

## Disposition in `vue-transform-foundation-hardening`

The foundation change addresses the blocking review findings:

- Vue workspace construction moved to `packages/source-vue/src/workspace.ts` behind `WorkspaceProvider`; the neutral CLI no longer owns a `vue-workspace.ts` implementation.
- `target-native` no longer declares or references `@memolabs-apps/source`, and the metadata boundary test covers all dependency sections and project references.
- Workflow bindings now carry literal or expression kinds, with schema validation and versioned refusal for missing or unknown kinds; literal text is escaped before SFC emission.
- Transform refusal now checks screen coverage independently of provider findings, skips migration and workspace providers after a refusal, and the compiler-only manifest uses provider-reported commands rather than claiming native build commands.
- The refusal, literal-text, provider-boundary and compiler-only command regressions are covered by package tests.

The action/state, router, portability and style findings remain gated for their own changes. This change does not make T3 or T4 evidence true.

## Verification

The following checks were run while preparing this review:

- `corepack pnpm build`: 36/36 passed
- `corepack pnpm test`: 66/66 passed
- `corepack pnpm typecheck`: 68/68 passed
- `corepack pnpm lint`: passed
- `corepack pnpm format:check`: passed
- `corepack pnpm exec openspec validate --all`: 65 passed, 0 failed
- strict validation for each of the five new changes: passed
- independent read-only review: no remaining blocker after the atomicity, provider-command and literal-escaping fixes

A green validation run proves the planning documents are internally valid. It does not prove the unimplemented hardening or any native behavior.
