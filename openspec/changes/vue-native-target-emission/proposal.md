# vue-native-target-emission

## Why

`source-vue` now lowers Vue single file components into the Workflow IR, but
nothing consumes that IR. `target-vue` compiles a Vue single file component
directly, so the two ends of the transformation are still welded to the source
syntax and `navirox transform` can only run against fake providers. The IR needs a
real producer of native source, or the golden path stays a contract.

## What Changes

- Add a neutral target package that implements `TargetProvider.emit(workflow,
  profile)` and emits native source from the Workflow IR, never from a source
  single file component.
- Emit one native single file component per `generated` screen, with the IR's
  primitives, bindings, actions and test identifiers, plus a deterministic
  provenance manifest naming the IR hash and the target version.
- Refuse any screen whose coverage is not `generated` with a finding and no file,
  so a target can never emit a screen the lowering did not actually cover.
- Prove the seam: the target imports no source framework and no adapter.
- Move the target-side seam types (`TargetProvider`, `TargetProfile`,
  `EmittedFile`, `EmissionResult`, `EmissionFinding`) into the neutral Workflow IR
  package and re-export them from `@memolabs-apps/source`. The seam declared them
  in the source-side package, which the static boundary forbids a target to
  import, so a real target could not name the contract it must satisfy.

## Capabilities

### New Capabilities

- `workflow-native-emission`: how a target consumes the Workflow IR and emits
  native source, what it emits, and how it refuses a screen it does not cover.

### Modified Capabilities

- `source-transform-provider-seam`: the target-side contract types move to the
  neutral IR package so a target can name them without importing the source side.

## Impact

Adds a new package under `packages/` and a workspace entry in the root
`tsconfig.json` references. It changes no IR schema version, no source adapter, no
public `@memolabs-apps/*` name and no runtime seam. `target-vue`'s existing
single-file-component path is left intact.
