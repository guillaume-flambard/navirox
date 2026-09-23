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

- [ ] 3.1 Convert one real Angular component from a pinned public revision and
  check the emitted screen declares every binding it uses. Verify the conversion
  test on the pinned fixture.
- [ ] 3.2 Build and run the emitted screen on iOS and Android, exercising at least
  one declared interaction. Verify the platform runs and their recorded result.

## 4. Validate the build

- [ ] 4.1 Run `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`
  and `corepack pnpm format:check`. Verify all exit 0.
- [ ] 4.2 Run `corepack pnpm exec openspec validate
  angular-target-runnable-conversion --strict`. Verify it exits 0.
