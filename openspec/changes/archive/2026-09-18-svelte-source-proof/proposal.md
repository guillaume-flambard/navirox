## Why

One adapter proves an interface compiles, not that it is a seam. The Vue adapter
could be shaped by Vue all the way down and nothing in the repository would say
so, because there is no second implementation to disagree with it. The
repositioning names Svelte as the second source precisely because it differs
enough from Vue to expose a false abstraction while staying small enough to
build: runes and stores instead of reactivity and Pinia, `.svelte` files instead
of single file components, file based routing as the framework's own documented
convention rather than a directory a project happens to use.

This change is the go/no-go gate. If the neutral core has to grow a Svelte shaped
branch, or the App Graph has to grow a Svelte shaped node, the abstraction is in
the wrong layer and the roadmap should be repaired before Angular, React or
Astro are attempted.

## What Changes

- Move the browser capability scan from `@navirox/source-vue` into
  `@navirox/source`. The pattern set describes browser APIs, not a framework, and
  two adapters now need it: this is the first concept the model admits because a
  second adapter needs it, which is the rule the seam was built with.
- Add `@navirox/source-svelte`: detection, component discovery, store modules,
  capability use through the shared scan, and the same finding vocabulary the Vue
  adapter uses.
- Add `@navirox/source-sveltekit`: detection and real route extraction from the
  filesystem routing SvelteKit documents, composing the Svelte adapter through the
  `composes` field the registry already honours.
- Register both adapters at the composition root and add the cross-adapter
  comparison: the same feature journey implemented twice has to produce reports
  that are structurally comparable, node kind for node kind and capability for
  capability, with no adapter specific concept in the shared model.
- Update the support matrix and the package table.

## Capabilities

### New Capabilities

- `source-svelte`
- `source-sveltekit`

### Modified Capabilities

- None

## Impact

- New packages: `packages/source-svelte` and `packages/source-sveltekit`.
- `packages/source`: gains the capability scan and its pattern set, moved out of
  the Vue adapter unchanged in behaviour. No published requirement changes.
- `packages/source-vue`: loses the moved module and imports it instead.
- `packages/cli`: registers the two new adapters at the composition root.
- `turbo.json`: the `test` task has to cover package fixtures as well as sources,
  because a boundary or comparison test reads files outside its own package.
- Root `tsconfig.json`, `pnpm-lock.yaml`, `README.md`, and a new evidence file.
- Not touched: `examples/vue-basic`, the runtime packages, the CI workflows.
- Out of scope: Svelte 4 support, SvelteKit server routes and load functions,
  `$lib` alias resolution, and migration transforms. Each is named as a finding
  rather than guessed.
