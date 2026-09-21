## Why

Navirox can inspect Vue and can emit a deliberately narrow target template, but it
cannot yet demonstrate that emitted output runs as an independent native screen or
matches a declared web scenario. This blocks the only product claim that matters to
a developer evaluating a web-to-native migration: a repeatable, measured result.

Baserow is the first Vue/Nuxt commercial qualification target. Its benchmark is
valuable only if Navirox can progress from route inventory to a truthful,
screen-level proof. This change establishes that proof mechanism before claiming
Baserow compatibility or visual fidelity.

## What Changes

- Make `@memolabs-apps/target-vue` emit a source-provenance manifest alongside
  every eligible generated native screen.
- Add one small, Baserow-shaped Vue fixture with a web source screen and a native
  screen generated from it. No hand-written replacement view is permitted.
- Add reproducible web and native capture scripts for named fixture scenarios,
  including a motion capture sequence when a scenario declares motion.
- Add a normalized comparison report with explicit tolerances, declared masks and
  an artifact directory. A failed or unsupported comparison is a result, not a
  silent pass.
- Run the target compiler against the pinned Baserow benchmark only as a
  diagnostic. Record every blocker and make no Baserow visual-fidelity claim.

## Capabilities

### New Capabilities

- `vue-target-provenance`
- `visual-benchmark`

### Modified Capabilities

- None

## Impact

- `packages/target-vue`, a Vue fixture and its generated native output, scripts,
  evidence documentation, and the external benchmark catalog.
- The source adapters, neutral App Graph, runtime provider seam and current Baserow
  support level remain unchanged.
- Out of scope: Nuxt, Angular, Next or any second target generator; automatic
  translation of RouterLink; a claim that Baserow or any external application has
  passed visual fidelity; EAS integration.

