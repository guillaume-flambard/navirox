# Design

## Composition boundary

`transform()` remains the deep orchestration module. It accepts providers and stages through `TransformDeps`, refuses unsafe paths before writing and owns the final planned-file write. The CLI is the composition root: when no test context supplies dependencies, it creates a Vue-only registry, the real `createVueLowering()` provider, the real `createNativeTarget()` provider and the generated Vue workspace scaffold.

The CLI imports the concrete source and target packages in one module. The transform module and target-native package do not import a source adapter or source package.

## Generated workspace

The target emits screen files from the Workflow IR. A separate scaffold receives the lowering and emission results and adds the workspace shell: package metadata, Vue entrypoint, primitive registration, application entrypoint and a compiler-backed verification script. The shell maps Navirox primitives to ordinary Vue components for this generation gate. It is not a native runtime claim.

The target derives each screen file stem from `screen.name`, then the source basename, then the screen id. It removes unsafe characters and suffixes duplicate stems deterministically. This keeps imports valid when graph-derived screen ids contain path separators or namespace separators.

## Refusal behavior

The positive fixture contains only covered screens. The refusal fixture is exercised separately. Lowering and emission findings are carried into the transform result. A non-generated screen produces no target file and no scaffold import. The generated workspace never contains a hand-authored replacement for it.

## Verification

The generated workspace's package test parses and compiles every `.vue` file with `@vue/compiler-sfc`. This proves that the generated representation is executable as a Vue source workspace without claiming that a device runtime or visual result exists. A future T3 change owns behavioral and device journeys.

## Rejected shortcuts

- Reusing a fake provider in the delivered CLI would prove the orchestrator, not the product path.
- Importing `target-vue` would bypass the Workflow IR and couple the target to a source-shaped Vue compiler path.
- Writing a replacement screen by hand would hide the refusal boundary.
- Claiming a native workspace from a compiler-only Vue proof would exceed the evidence.
