# source-transform-provider-seam

## Why

The Workflow IR exists, but nothing produces it and nothing consumes it. A source
framework must lower its own syntax into the IR, and a target must emit native
source from the IR, without either naming the other. Today `source-vue` produces
an `AppGraph` for analysis and `target-vue` compiles a single-file component
directly, so the two ends are welded together and no second framework or renderer
can join.

## What Changes

- Define `SourceTransformProvider.lower()` as a source-side extension that turns a
  selection of the analysed application into a Workflow IR.
- Define `TargetProvider.emit()` independently: it receives the IR and a target
  profile, and knows no source framework.
- Enforce the asymmetry with a static check: a source adapter never imports a
  target provider or the runtime, and a target provider never imports a source
  framework.
- Add a fake lowerer, a fake target and two contrasting test adapters, so the
  interface is proven without either seam existing in production yet.

## Capabilities

### New Capabilities

- `source-transform-provider-seam`: the two-sided contract that lets a source
  lower into the IR and a target emit from it, with no cross import.

### Modified Capabilities

None.

## Impact

This touches `@memolabs-apps/source` (the lowering contract) and the target
packages (the emission contract). It changes no graph concept, no existing schema
version, no public `@memolabs-apps/*` type name and no runtime seam.
