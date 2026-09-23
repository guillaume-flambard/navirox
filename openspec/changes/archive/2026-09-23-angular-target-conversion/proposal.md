## Why

The repository proves one source-to-native conversion, the Vue target. The
Angular journey was proven with a hand-written companion, so an Angular
application still receives an audit rather than a conversion. This change adds a
second target that transforms Angular templates into the same native surface.

## What Changes

- Add `@memolabs-apps/target-angular`, which compiles a bounded Angular template
  into the native Symbiote Vue single-file-component surface, with a
  deterministic provenance manifest.
- Translate the accepted constructs: elements map to native primitives,
  `*ngIf` to `v-if`, `*ngFor` to `v-for`, `(click)` to `@press`, `[prop]` to
  `:prop`, and `[(ngModel)]` to `v-model` on a text-input.
- Refuse an unsupported construct (`*ngSwitch`, `[ngClass]`, a custom element,
  or text directly inside a non-text primitive) with a finding and no generated
  source.

## Capabilities

### New Capabilities

- `angular-target-subset`: the Angular template constructs the Angular target
  accepts and refuses, and the native output it emits with provenance.

### Modified Capabilities

None.

## Impact

This adds the package `packages/target-angular` and lists it in the root
`tsconfig.json` references. It reuses `@vue/compiler-dom`, already a workspace
dependency of `target-vue`, as the HTML tokenizer for the Angular template. It
changes no source adapter, no runtime seam, no public `@memolabs-apps/*` type
name and no schema version, and it claims only constructs the native renderer
already demonstrates.
