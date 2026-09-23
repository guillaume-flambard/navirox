## Why

`compileAngularComponent` refuses any class that uses `inject(...)`, so the
authorized proof component
`packages/source-angular/fixtures/record-workflow/src/app/record-workflow.component.ts`
cannot be converted: its only state lives on `inject(RecordWorkflowService)`.
The end-to-end runnability proof is blocked until that field form is translated
or the component is refused forever.

## What Changes

- Translate a bounded inject field: `name = inject(Type)` where `Type` is a
  class whose declared signals, literal fields and simple methods the existing
  class translator already accepts, with the injectable source resolved beside
  the component.
- Rewrite template calls on the inject target (`name.member()` for a signal
  `member`) so every binding resolves against the emitted native single-file
  component state.
- Keep refusing, with a finding and no generated source, an inject the
  translator cannot fully resolve or whose target class is outside the same
  closed set as a component class.
- Wire the CLI convert path so Angular conversion supplies the injectable
  source beside the component script.

## Capabilities

### New Capabilities

- `angular-target-inject`: how a bounded `inject(Type)` field is translated
  into emitted native state so the screen's bindings resolve, and when that
  inject is refused.

### Modified Capabilities

None. Template subset rules and the existing component-state rules outside
inject are unchanged; `angular-target-runnability` is still only a delta on
the open `angular-target-runnable-conversion` change and is not modified here.

## Impact

This touches `@memolabs-apps/target-angular` (inject recognition and nested
state emission inside `compileAngularComponent`) and `@memolabs-apps/cli` (it
must read and pass the injectable module beside the component). It changes no
source adapter, no runtime seam, no public `@memolabs-apps/*` type name and no
schema version. Layer: target edge, package `packages/target-angular` (and the
CLI convert path that already owns Angular script passing). The change claims
only the inject form the fixture and tests prove; constructor injection, multi
inject, `inject` with options, and services outside the class translator's
closed set stay refused.
