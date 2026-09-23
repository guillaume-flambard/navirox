## Why

The Vue target refuses `v-show`, `v-model` and every event but `@press`, yet the
native renderer implements them: the Symbiote Vue adapter supplies its own
`vShow` and `vModelText`, and the pressable surface maps `@press-in`/`@press-out`/
`@long-press` to the native press machine. A real form or toggle screen is
therefore refused even though every construct in it renders natively.

## What Changes

- Accept `v-show`, which the adapter applies as `display: none` after commit.
- Accept `v-model` on a `text-input`, which the adapter's `vModelText` owns.
- Accept the press events `@press-in`, `@press-out` and `@long-press` beside
  `@press` and `@click`.
- Keep refusing a directive the native renderer does not implement, with a
  finding.

## Capabilities

### New Capabilities

None: this extends an existing capability.

### Modified Capabilities

- `vue-target-subset`: the accepted directive set is extended to the directives
  the native renderer implements; the refusal rule is unchanged.

## Impact

This touches `@memolabs-apps/target-vue` only. It changes no package boundary, no
public `@memolabs-apps/*` type name, no schema version, no source adapter and no
runtime seam. It claims only directives the Symbiote Vue adapter already
implements, and the evidence is recorded in `design.md`.
