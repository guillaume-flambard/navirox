## 1. Translate the control-flow blocks

- [x] 1.1 Rewrite `@if`/`@else if`/`@else` and `@for (item of items; track ...)`
  into `v-if`/`v-else-if`/`v-else` and `v-for` before parsing, and keep
  `@switch`/`@defer` refused. Done: `rewriteAngularBlocks` rewrites the blocks
  recursively, `@empty` and a malformed header are refused, and the compiler
  tests cover each translation and each refusal; `ng-container`/`template` also
  render as transparent fragments.

## 2. Translate the component state

- [x] 2.1 Add `compileAngularComponent({ template, script, filename, outputPath })`
  with a bounded class-state translator (literal fields, `signal(...)` fields, and
  simple methods). Done: `compileAngularComponent` translates literal fields,
  `signal(...)`, `computed(...)` and simple methods (`this.x` -> `x.value`),
  rewrites `name()` -> `name` for a signal in the template, and refuses a class
  using a constructor, decorator, DI, lifecycle hook or getter/setter with a
  finding and no source. Four tests cover the translations and the refusals.
- [x] 2.2 Pass the component source beside the template from the CLI convert path.
  Done: `ConvertInput { source, script? }` carries both, the CLI passes
  `readScript` in Angular mode, and the target runs `compileAngularComponent`
  when a script is present. `corepack pnpm build` exits 0.

## 3. Prove it end to end

- [x] 3.1 Convert one real Angular component from a pinned public revision and
  check the emitted screen declares every binding it uses. Verify the conversion
  test on the pinned fixture. Done: `convert.test.ts` drives `runConversion` on
  the record-workflow fixture justified against pinned SuiteCRM
  `2cd77380bc838b8bd6c80f9fbe25855d73ef860c`, asserts every binding root in the
  emitted template is declared in setup, and checks the written provenance names
  the component path, the script sha256, and the output path;
  `compileAngularComponent` now records `manifest.component` beside the
  template `input`. CLI convert tests 135/135, target-angular 23/23.
- [x] 3.2 Build and run the emitted screen on iOS and Android, exercising at least
  one declared interaction. Verify the platform runs and their recorded result.
  Done: `scripts/capture-angular-companion.mjs` drove the emitted screen on both
  platforms, five captures each (`rest`, `first-meaningful`, `midpoint`,
  `settled`, `interrupted`), with the recorded results in
  `docs/evidence/angular-companion-device-evidence-ios.json` and
  `docs/evidence/angular-companion-device-evidence-android.json`.

## 4. Validate the build

- [x] 4.1 Run `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`
  and `corepack pnpm format:check`. Verify all exit 0. Done: build 35/35
  successful, test 64/64 successful, lint clean, and format:check reports every
  file already formatted.
- [x] 4.2 Run `corepack pnpm exec openspec validate
  angular-target-runnable-conversion --strict`. Verify it exits 0. Done: the
  change validates strictly, and `openspec validate --all` passes 57 of 57.
