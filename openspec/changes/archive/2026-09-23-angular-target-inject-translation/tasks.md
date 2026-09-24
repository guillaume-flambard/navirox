## 1. Translate a bounded inject field

- [x] 1.1 Recognize `name = inject(Type)` in `compileAngularComponent` before the
  blanket `inject(` refusal, resolve `Type` from injectable sources supplied
  with the input, and translate `Type` with the existing class state translator.
  Verify: unit tests compile a fixture-shaped component
  (`workflow = inject(RecordWorkflowService)` plus a service with signals and
  methods) and assert emitted setup declares the inject object and reports no
  finding; a missing injectable source still refuses with a finding and no code.
- [x] 1.2 Rewrite template reads and calls on the inject target
  (`name.member()` for signals, `name.method()` for methods) the same way
  top-level component signals are rewritten, so every binding resolves against
  emitted state. Verify: the unit test asserts the compiled template contains
  the rewritten binding and does not contain the Angular call form for a signal;
  a service method used in `(click)` remains a call in the emitted screen.
- [x] 1.3 Keep every other `CLASS_UNSUPPORTED` rule in force: constructor,
  decorator, implements, lifecycle hook, getter/setter, and an inject the
  translator cannot fully translate still refuse the whole component. Verify:
  existing `compileAngularComponent` refusal tests still pass, plus a new test
  where the injectable class uses a constructor or `@Input` and the component
  returns no `code`.

## 2. Pass the injectable source from the CLI

- [x] 2.1 Extend the Angular convert path so that when the component script
  declares a bounded inject, the CLI reads the imported module and passes it
  beside the component script (extend `ConvertInput` or the Angular target
  compile signature without re-exporting provider types). Verify: a CLI convert
  test drives `runConversion` on an Angular screen whose component imports a
  readable service module and expects `converted` with generated code; when the
  service file is unreadable, the screen appears in `refused` with a finding
  and no file is written.
- [x] 2.2 Point the conversion at the real record-workflow fixture path shape
  (component file + `record-workflow.service.ts` in the same directory) and
  assert the emitted screen declares every binding the fixture template uses
  (`workflow.records`, `workflow.select`, `workflow.field`,
  `workflow.cycleStatus`, `workflow.save`, `workflow.status`,
  `workflow.saveState`, `workflow.attachment`, component methods). Verify: the
  test fails if any listed binding identifier is absent from the generated
  source.

## 3. Validate the workspace

- [x] 3.1 Run `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`
  and `corepack pnpm format:check`. Verify all exit 0.
- [x] 3.2 Run `corepack pnpm exec openspec validate
  angular-target-inject-translation --strict`. Verify it exits 0 (or
  `openspec validate --all` if the single-change flag is unsupported).
