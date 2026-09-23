## 1. Expose the command

- [x] 1.1 Add `convert` to the CLI command set with `--out`, `--write`,
  `--framework` and `--json`, plus help text. Verify `navirox --help` lists it
  and the argument tests pass.
- [x] 1.2 Add `@memolabs-apps/target-vue` as a CLI dependency and a tsconfig
  reference. Verify `corepack pnpm build` resolves it.

## 2. Convert

- [x] 2.1 Implement the handler: inspect, plan, compile each screen, emit only
  when the provider returns source, write the provenance record, and move the
  shared or portable units. Verify a convert test on a Vue fixture asserts the
  emitted screen and its provenance.
- [x] 2.2 Refuse an unsupported screen and report its findings. Verify a test
  with an unsupported construct writes nothing for that screen and names the
  finding.
- [x] 2.3 Refuse a write outside the output directory. Verify a test asserts the
  refusal and that nothing is written.

## 3. Validate the build

- [x] 3.1 Run `corepack pnpm build`, `corepack pnpm test`,
  `corepack pnpm lint` and `corepack pnpm format:check`. Verify all exit 0.
- [x] 3.2 Run `corepack pnpm exec openspec validate cli-screen-conversion
  --strict`. Verify it exits 0.
