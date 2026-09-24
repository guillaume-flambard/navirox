# vue-native-target-emission design

## Context

- `@memolabs-apps/workflow` defines the IR a target consumes.
- `@memolabs-apps/source` defines `TargetProvider.emit(workflow, profile) ->
  EmissionResult`, where `EmissionResult` is `{ files, findings }` and each file
  is `{ path, content }`.
- `@memolabs-apps/target-vue` already knows how to emit a native single file
  component for the Vue-renderer profile, but from a source single file component,
  not from the IR.

## Decisions

### A new neutral package, not a rewrite of `target-vue`

The IR target is a different seam: it consumes the framework-neutral IR, so it
must not know Vue source syntax. Adding it as a new package
`@memolabs-apps/target-native` keeps `target-vue`'s existing single-file-component
path working and keeps the target side neutral by name and by import. It is added
to the root `tsconfig.json` references so `tsc --build` sees it.

### The target-side contract types move to the neutral IR package

`@memolabs-apps/source` declared `TargetProvider`, `TargetProfile`, `EmittedFile`
and `EmissionResult` beside the lowering contract. The static import boundary
forbids a target package from importing `@memolabs-apps/source` or
`@memolabs-apps/source-*`, so a real target could not name the type it must
satisfy and had to duplicate it. The target-side types move to
`@memolabs-apps/workflow`, the neutral package that already owns the IR and that a
target may import, and `@memolabs-apps/source` re-exports them so existing callers
keep working. This is the change's one modification to a stable capability.

### The target refuses anything it did not fully cover

`emit` emits one file per screen whose `coverage.kind === 'generated'`. A screen
whose coverage is `refused`, `manual-required` or `excluded` produces a finding
and NO file, because emitting a screen the lowering did not cover would present an
uncovered screen as migrated.

### The emitted file is a native single file component

For each `generated` screen the target emits a native single file component whose
template is built from the IR's `ViewNode`s: each node becomes its `primitive`, its
`bindings` become attributes, and each `Action` becomes an event handler. Test
identifiers carried in a binding named `testID` are emitted as-is. The path is
`generated/<screen-id>.vue`, so the output layout is deterministic and traceable.

### Provenance names the IR, not the source

The emission carries a manifest per screen with the IR `hashWorkflow` value, the
target package version, the emitted path and the screen id. It names the IR
because that is the input the target actually read; it never names a source file,
which it cannot see.

### Determinism

Screens are emitted in IR order, nodes in tree order, and bindings and actions in
their declared order. The manifest is serialized with a fixed field order, so the
same workflow always emits the same bytes and hashes alike.

## Rejected shortcuts

- **Re-parsing the source single file component in the target.** It would re-weld
  the target to the source syntax and defeat the seam.
- **Emitting a best-effort screen for a non-generated coverage.** It would make an
  uncovered screen look migrated.
- **Sharing `target-vue`'s types by importing them.** A target importing another
  target is a dependency the layout does not have; the new package defines the
  small schema it needs.

## Interfaces

```ts
// packages/target-native/src/index.ts
export function createNativeTarget(): TargetProvider
```

It is the value a caller registers as the `emit` provider of `navirox transform`.
