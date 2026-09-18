# @navirox/source-next

## 0.1.0

### Minor Changes

- The first release. It carries the runtime seam and its Symbiote provider, the native component and API surfaces, the router, the scaffolder and its template, the `navirox` commands (`dev`, `doctor`, `inspect`, `plan`, `migrate`), the source adapter contract with the Vue, Nuxt, Svelte, SvelteKit, Angular, React, Next and Astro adapters, the migration classification and the compatibility registry, the migration engine, and Fast Refresh for single file components.

  Everything here is experimental. Vue 3 is the execution wedge and the only path with an end to end acceptance app; the other adapters ship detection and inspection rather than migration, and the compatibility registry reports `unknown` where it has no evidence. Nothing is published to npm yet, so this changeset is the release note for the version these packages will carry.

### Patch Changes

- Updated dependencies
  - @navirox/graph@0.1.0
  - @navirox/source@0.1.0
  - @navirox/source-react@0.1.0
