## Why

The Angular target emits only `<template>...</template>`. The component class the
template's bindings reference is never translated, so the emitted screen cannot
run: `v-if="ready"`, `v-for="item in items"` and `{{ item }}` name values that do
not exist in the native application. It also refuses `@if` and `@for`, which the
Angular v22 docs document as the normal way to conditionally show and repeat
content. This change makes the emitted screen runnable and proves it end to end.

## What Changes

- Translate the component's declared state into the emitted native single-file
  component, so every binding resolves.
- Translate the control-flow blocks the docs define: `@if`/`@else if`/`@else` to
  `v-if`/`v-else-if`/`v-else`, and `@for (item of items; track ...)` to `v-for`.
- Keep refusing, with a finding, any construct the compiler does not implement,
  including a component whose class state it cannot translate.
- Add an end-to-end proof: one real pinned Angular component is converted and the
  emitted screen runs on iOS and Android.

## Capabilities

### New Capabilities

- `angular-target-runnability`: the emitted screen carries the component's state
  and runs, and is proven end to end on a real component.

### Modified Capabilities

- `angular-target-subset`: `@if`/`@else if`/`@else` and `@for` are accepted and
  translated instead of refused.

## Impact

This touches `@memolabs-apps/target-angular` (a component entry point and a
bounded class-state translator) and `@memolabs-apps/cli` (it must pass the
component source, not only the template). It changes no source adapter, no
runtime seam, no public `@memolabs-apps/*` type name and no schema version. The
translator is bounded: a component whose state it cannot translate is refused,
never emitted with a missing identifier.
