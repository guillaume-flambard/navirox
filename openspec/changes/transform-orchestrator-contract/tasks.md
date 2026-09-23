## 1. Deep module shape

- [x] 1.1 Declare `TransformInput`, `TransformResult` and
  `transform({ root, app, profile, output, write?, ... })` in
  `packages/cli/src/transform.ts`, exporting them from the package index.
  Verify `corepack pnpm --filter @memolabs-apps/cli build` exits 0 and the types
  are exported.
  Evidence: build exit 0; index.ts re-exports `transform`, `TransformInput`,
  `TransformResult` and the render/json helpers.

## 2. Ordering and refusal before write

- [x] 2.1 Sequence discovery, eligibility, version gate, inspect/plan, lower,
  emit, migrate and scaffold planning in one function that stops at the first
  refusal. Verify a test with a fake reader classified `refused` returns that
  finding and never calls lower, emit or migrate.
  Evidence: `transform.test.ts` "stops at a refused discovery..." asserts
  `stages === ['discovery']` and lower/emit/migrate not called.
- [x] 2.2 Default to dry-run: plan every write and skip the commit unless
  `write` is true. Verify a dry-run test asserts no file exists under a temp
  output path and the result is marked dry-run, and a write test asserts the
  same planned paths are created.
  Evidence: dry-run and write tests share `plannedPaths`; dry leaves output
  empty, write creates every planned path.

## 3. Path and profile safety

- [x] 3.1 Refuse path traversal, an output inside the source root and an output
  equal to the source root, each before any write-capable stage. Verify tests
  for the three cases return an unsafe-path finding and leave the filesystem
  untouched.
  Evidence: one test covers all three cases; each returns `unsafe-path` and
  lower is never called.
- [x] 3.2 Refuse an unknown or ambiguous profile with a finding that names the
  unknown id or the candidates. Verify a test for an unknown profile exits
  before discovery writes and before lower runs.
  Evidence: unknown-profile finding names `not-a-profile`; discover and lower
  not called; ambiguous-profile lists candidates.

## 4. Output layout and manifest

- [x] 4.1 Report `generated/`, `shared/`, `manual/`, `navirox.manifest.json`,
  coverage totals, deltas/refusals and reproduction commands on
  `TransformResult`. Verify a successful dry-run fixture result contains each
  of those fields with non-empty planned paths for an eligible fake
  repository.
  Evidence: layout test asserts all four layout fields, coverage object,
  commands length, and planned paths under each prefix plus the manifest name.
- [x] 4.2 Write `navirox.manifest.json` only on an explicit write, tying the
  discovery snapshot hash, the workflow hash and the file list. Verify a write
  test reads the manifest and matches those three facts to the dry-run result.
  Evidence: manifest test asserts no file on dry-run, file on write, and
  `snapshotHash`/`workflowHash`/`files` match the dry-run result.

## 5. CLI surface

- [x] 5.1 Add `transform` to `TCommand`, parse `--app`, `--profile`, `--out`
  and `--write`, dispatch to the deep module, and default to dry-run. Verify
  `corepack pnpm --filter @memolabs-apps/cli test` covers help text, a dry-run
  invocation and a refusal exit code.
  Evidence: CLI package tests 131/131; help returns 0, dry-run JSON ok with
  dryRun true, refusal exits 1 with `unknown-profile`.
- [x] 5.2 Prove the path with a fake source and a fake target end to end
  through the command. Verify one test drives `runCli` from arguments to a
  complete `TransformResult` with a manifest and no source-framework package is
  imported by `packages/cli/src/transform.ts` (the existing boundary scan
  covers the file).
  Evidence: e2e test walks `runCli` to written manifest with matching hashes;
  `packages/source` boundary tests 58/58 after the fixture-string fix.

## 6. Validate the build

- [x] 6.1 Run `corepack pnpm build`, `corepack pnpm test`, `corepack pnpm lint`
  and `corepack pnpm format:check`. Verify all exit 0.
  Evidence: build 64/64 tasks, test green, eslint exit 0, prettier exit 0 after
  formatting the three new files.
- [x] 6.2 Run `corepack pnpm exec openspec validate transform-orchestrator-contract
  --strict`. Verify it exits 0.
  Evidence: "Change 'transform-orchestrator-contract' is valid", exit 0.
