# Vue transform workspace run evidence

Date: 2026-09-24

## Scope

This evidence covers the Vue T2 generation increment: the delivered `navirox transform` command composes the real Vue inspection/lowering path and the neutral target, then generates a Vue workspace whose SFCs are compiled by the workspace's own test command. It does not claim native iOS or Android execution, browser rendering, or visual fidelity.

## Positive run

Fixture:

`packages/cli/fixtures/vue-transform-workspace/vue`

Command:

```bash
node packages/cli/dist/bin.js transform "$PWD/packages/cli/fixtures/vue-transform-workspace/vue" \
  --profile vue-mobile \
  --out /tmp/navirox-vue-evidence-final.XgS6gK \
  --write \
  --json
corepack pnpm --dir /tmp/navirox-vue-evidence-final.XgS6gK install --ignore-scripts
corepack pnpm --dir /tmp/navirox-vue-evidence-final.XgS6gK test
```

Observed result:

- Transform exit code: `0`
- `ok`: `true`
- Stages: `discovery`, `eligibility`, `version-gate`, `inspect-plan`, `lower`, `emit`, `migrate`, `provenance`, `scaffold`
- Coverage: `generated=19`, `manualRequired=0`, `excluded=0`, `refused=0`
- Workspace test exit code: `0`
- Workspace test output: `Verified 3 Vue SFCs.`
- Snapshot hash: `74964dcb1031ce0e8af4d29e61bb61fd5a080c634e3d95b117cc1e6baa623f24`
- Workflow hash: `192341c8c2599bad2476973afa75b6e69c7d604113b990b84c6ce72c01310152`
- `navirox.manifest.json` SHA-256: `88d20e75fcb96dbc305ed37b096ae762989eed21c8ada665d8519373061599a8`
- `generated/Home.manifest.json` SHA-256: `73a14a9f385b57c36f4cbff7f001b0f5e36d6a8f4492e3dd15096105dfa95ef8`
- `generated/About.manifest.json` SHA-256: `fea1ea40a2f237ef3eb8d91ed1ab0694728a9045f79861ac7ad90d60f5878ab5`

The generated workspace contains `generated/Home.vue`, `generated/About.vue`, `src/main.ts`, `src/native.ts`, `src/App.vue`, `package.json`, and `scripts/verify-generated.mjs`. The target emitted no hand-written replacement screen.

## Refusal run

Fixture:

`packages/cli/fixtures/vue-transform-workspace-refused/vue`

Command:

```bash
node packages/cli/dist/bin.js transform "$PWD/packages/cli/fixtures/vue-transform-workspace-refused/vue" \
  --profile vue-mobile \
  --out /tmp/navirox-vue-evidence-refused-clean.Ub50Q6 \
  --write \
  --json
```

Observed result:

- Transform exit code: `1`
- `ok`: `false`
- Refusal codes: `unsupported-watcher`, `uncovered-screen`
- Refusal message: `src/views/Refused.vue:6 uses watch() or watchEffect().`
- Coverage: `generated=4`, `refused=1`
- The output directory remained empty.
- No `Refused.vue` or `navirox.manifest.json` was written.

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
corepack pnpm exec openspec validate vue-transform-workspace-run --strict
corepack pnpm exec openspec validate --all
```

Observed totals: build `66/66`, tests `66/66`, OpenSpec `60/60`.

## Limitations

- The generated runtime maps Navirox primitives to ordinary Vue components for this compiler-backed generation gate.
- The workspace test parses and compiles SFCs; it does not run a browser, native shell, iOS build, Android build, device journey, or visual measurement.
- The result is limited to the exact Vue fixture, versions, profile and supported constructs.
- No external repository, credentials, customer data or service was used.
