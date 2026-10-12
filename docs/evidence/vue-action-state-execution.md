# Vue action and state execution evidence

Date: 2026-09-24

## Scope

This evidence covers the bounded Vue action and state profile implemented by `vue-action-state-execution`. It covers the neutral Workflow IR v3 contract, Vue lowering, native target emission and the source-owned generated workspace verifier. It does not claim native iOS or Android execution, browser interaction, device journeys or visual fidelity.

## Supported profile

- State: scalar `ref` values initialized as string, number, boolean or empty.
- Actions: `state-update` with `set`, `increment` or `toggle`.
- Target: one existing scalar `ref` per action.
- Event binding: explicit `actionId` linked to an action on the same screen.
- Source grammar: inline mutation, or a named no-argument function containing one supported mutation statement.

The target emits typed `ref` initializers and deterministic handler functions. Repeated emission of the same Workflow IR produces the same action and handler bytes.

## Positive run

Fixture:

`packages/cli/fixtures/vue-transform-workspace/vue`

Command:

```bash
corepack pnpm build
node packages/cli/dist/bin.js transform "$PWD/packages/cli/fixtures/vue-transform-workspace/vue" \
  --profile vue-mobile \
  --out /tmp/navirox-vue-action-state-evidence \
  --write \
  --json
corepack pnpm --dir /tmp/navirox-vue-action-state-evidence install --ignore-scripts
corepack pnpm --dir /tmp/navirox-vue-action-state-evidence test
```

Observed result:

- Transform exit code: `0`
- `ok`: `true`
- Coverage: `generated=19`, `manualRequired=0`, `excluded=0`, `refused=0`
- Workflow hash: `98251b2927795d0441e02222e3ac9e3be90cdf1fcb5ee3520e4ea6929da151f4`
- Generated workspace test exit code: `0`
- Generated workspace test output: `Verified 3 Vue SFCs.`
- `navirox.manifest.json` SHA-256: `5172fede00b9c411cbb219d8a85abc65168a3b3b1d29c72798f0697c9b110ee9`
- `generated/Home.manifest.json` SHA-256: `5861dd62e6249e84b56dd999e31f4d54cca135a801dc760614deb8e597b5621f`
- `generated/About.manifest.json` SHA-256: `c77148224745eb26d23aa0cb78fc3bde56fe72d545f11b56efe8b34e75c8950d`

The generated `Home.vue` contains typed state initializers and an inline increment handler linked by `actionId`. The workspace verifier parses and compiles every generated SFC and checks that each generated event binding names a generated handler function.

## Refusal matrix

| Construct | Finding | Result |
| --- | --- | --- |
| `computed`, `reactive`, props or emits state | `unsupported-state-kind` | Whole screen refused |
| Non-scalar `ref` initializer | `unsupported-state-initial-value` | Whole screen refused |
| Arbitrary call or effectful named handler | `unsupported-action-handler` | No action emitted |
| Handler parameters or multiple mutation statements | `unsupported-action-handler` | No action emitted |
| Event modifier | `unsupported-action-modifier` | No action emitted |
| `watch` or `watchEffect` | `unsupported-watcher` | No partial screen emitted |
| Any refused screen in the transform | `incomplete-workflow` | Migration, provenance and workspace writing are skipped |

The lowering tests cover positive scalar refs, named and inline handlers, set, increment, toggle, non-scalar state, arbitrary handlers, parameters, multiple statements, modifiers and effects. Each refusal produces an empty node tree rather than a partial executable screen.

## Verification

The focused verification commands are:

```bash
corepack pnpm --filter @memolabs-apps/workflow test
corepack pnpm --filter @memolabs-apps/source-vue test
corepack pnpm --filter @memolabs-apps/target-native test
corepack pnpm --filter @memolabs-apps/cli test
corepack pnpm lint
corepack pnpm format:check
corepack pnpm typecheck
corepack pnpm exec openspec validate vue-action-state-execution --type change --strict
corepack pnpm exec openspec validate --changes --strict
corepack pnpm exec openspec validate --specs
corepack pnpm exec openspec validate --all
```

The final baseline passed with build `36/36`, tests `66/66`, typecheck `68/68`, lint and format clean, change validation `7/7`, stable spec validation `59/59`, and all validation `66/66`. OpenSpec emitted only non-blocking informational warnings about long requirements and pre-existing placeholder Purpose sections. No external repository, credentials, customer data or service was used.

## Limitations

- The generated workspace verifier checks SFC validity and handler linkage. It does not execute a browser interaction.
- Supported source state is limited to scalar refs. Broader Vue state and action forms remain explicit refusals.
- Device behavior and visual proof remain T3 and T4 work, gated until this deterministic T2 evidence is accepted.
