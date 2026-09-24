# Vue transform workspace run evidence

Date: 2026-09-24

## Scope

This evidence covers the Vue T2 generation increment: the delivered `navirox transform` command composes the real Vue inspection/lowering path, the neutral target and the source-owned Vue workspace provider, then generates a Vue workspace whose SFCs are compiled by the workspace's own test command. It does not claim native iOS or Android execution, browser rendering, or visual fidelity.

## Positive run

Fixture:

`packages/cli/fixtures/vue-transform-workspace/vue`

Command:

```bash
node packages/cli/dist/bin.js transform "$PWD/packages/cli/fixtures/vue-transform-workspace/vue" \
  --profile vue-mobile \
  --out /tmp/navirox-vue-evidence-final.7NZ7K6 \
  --write \
  --json
corepack pnpm --dir /tmp/navirox-vue-evidence-final.7NZ7K6 install --ignore-scripts
corepack pnpm --dir /tmp/navirox-vue-evidence-final.7NZ7K6 test
```

Observed result:

- Transform exit code: `0`
- `ok`: `true`
- Stages: `discovery`, `eligibility`, `version-gate`, `inspect-plan`, `lower`, `emit`, `migrate`, `provenance`, `scaffold`
- Coverage: `generated=19`, `manualRequired=0`, `excluded=0`, `refused=0`
- Workspace test exit code: `0`
- Workspace test output: `Verified 3 Vue SFCs.`
- Snapshot hash: `74964dcb1031ce0e8af4d29e61bb61fd5a080c634e3d95b117cc1e6baa623f24`
- Workflow hash: `dc877cc23ce54b73964bb10ad96b8ddee12aed6b5484ff36aa3a064fead34c03`
- `navirox.manifest.json` SHA-256: `ce9774afc2e8319b614497f7c0b4fe52cb584e52f6e943256506618855428cc5`
- `generated/Home.manifest.json` SHA-256: `94c723ce18064a71c58120d88464b616408e5de5fcb811f44776c7163eaf9dfb`
- `generated/About.manifest.json` SHA-256: `fe5968da096d45f2a0ecea5d033d82e4201017e7e29441ad5372c05b3f1569dd`

The generated workspace contains `generated/Home.vue`, `generated/About.vue`, `src/main.ts`, `src/native.ts`, `src/App.vue`, `package.json`, and `scripts/verify-generated.mjs`. The target emitted no hand-written replacement screen. The manifest lists the transform reproduction command and the generated workspace's `pnpm test` command only; it does not claim unavailable iOS or Android build commands.

## Refusal run

Fixture:

`packages/cli/fixtures/vue-transform-workspace-refused/vue`

Command:

```bash
node packages/cli/dist/bin.js transform "$PWD/packages/cli/fixtures/vue-transform-workspace-refused/vue" \
  --profile vue-mobile \
  --out /tmp/navirox-vue-evidence-refused.KwazCX \
  --write \
  --json
```

Observed result:

- Transform exit code: `1`
- `ok`: `false`
- Refusal codes: `unsupported-watcher`, `uncovered-screen`, `incomplete-workflow`
- Refusal message: `src/views/Refused.vue:6 uses watch() or watchEffect().`
- Coverage: `generated=4`, `refused=1`
- The output directory remained empty because the complete workflow was not generated.
- Migration and workspace providers were not called after the refusal.
- No `Refused.vue`, generated screen replacement or `navirox.manifest.json` was written.
- Workflow hash: `2ec0f8dd880cb68017dfe523e3dbc1ff0f1d93b293b94261c77cc5ba0d813649`

## Input hashes

- Positive `package.json`: `245f95bc62736bf75b5811ff4314e7796facad4f19816d9caaf7d4c4479170a4`
- Positive `pnpm-lock.yaml`: `978daef67c14b0e884180975fc549fbf25c8e1752b3e6e245771eb822c8e705c`
- Positive `src/main.js`: `8fcb0e758ffb6eb53ad25f508c57067b137a86d8842d0c7f3eef33c1d66318fb`
- Positive `src/views/Home.vue`: `8275f639788aa3b39a7d00892b674cd6a1844a63750c0cc96de7c4f2045c7f04`
- Positive `src/views/About.vue`: `bb8cbc3c2c55256e85335fd15e9becf9202d4c1fb273eceac244ba7205bbea4c`

## Baseline

All commands exited `0`:

```bash
corepack pnpm build
corepack pnpm test
corepack pnpm lint
corepack pnpm format:check
corepack pnpm typecheck
corepack pnpm exec openspec validate vue-transform-workspace-run --strict
corepack pnpm exec openspec validate --all
```

Observed totals: build `36/36`, tests `66/66`, typecheck `68/68`, OpenSpec `65/65`.

## Limitations

- The generated runtime maps Navirox primitives to ordinary Vue components for this compiler-backed generation gate.
- The generated workspace is produced by the source-owned `WorkspaceProvider`; the neutral CLI only plans and writes the returned files and provider-reported commands.
- The workspace test parses and compiles SFCs; it does not run a browser, native shell, iOS build, Android build, device journey, or visual measurement.
- The result is limited to the exact Vue fixture, versions, profile and supported constructs.
- The Workflow IR schema is version 2 because literal and expression binding kinds are explicit; older serialized shapes are refused rather than guessed.
- No external repository, credentials, customer data or service was used.
