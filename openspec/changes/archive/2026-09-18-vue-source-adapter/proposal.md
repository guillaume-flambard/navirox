## Why

Change 1 built the source seam and left it empty. `@memolabs-apps/source` owns the
contract and `@memolabs-apps/graph` owns the model, but nothing implements the
contract, so the seam has never carried a real project through it and
`navirox inspect` still does not exist. A contract that no implementation has
been written against is a guess. This change turns it into a fact by making Vue
the first adapter and routing the first product command through it.

It is also the honest version of the repositioning's first move. The
repositioning says Vue becomes adapter #1 and its observable behaviour is
preserved. Today there is no observable Vue inspection behaviour to preserve,
because inspection never shipped. So this change is where the Vue path stops
being the identity and becomes the first implementation of a generic contract.

## What Changes

- Add `@memolabs-apps/source-vue`, the first source adapter: Vue detection with
  evidence, SFC and store discovery, browser capability detection, manifest
  dependencies, and an App Graph fragment. It declares `experimental` support
  and the Vue version range it is tested against.
- Extend `SourceInspection` in `@memolabs-apps/source` to carry what an adapter
  discovered (units, capabilities, dependencies, routes) instead of only a
  descriptor and findings. The published requirements for `source-adapter` do
  not pin the shape of that payload, so this is an implementation change and
  needs no modified capability.
- Implement `@memolabs-apps/inspect`: a framework-neutral pipeline that takes a
  registry, selects an adapter, runs it, assembles the versioned App Graph and
  produces a versioned report in human and machine form.
- Add `navirox inspect` to the CLI, with `--json` and `--framework`, composing
  the adapter registry at the composition root.
- Record the one new runtime dependency, `@vue/compiler-sfc`, with its version
  and the reason it exists.

## Capabilities

### New Capabilities

- `source-vue`
- `inspect-command`

### Modified Capabilities

- None

## Impact

- New package: `packages/source-vue` (`@memolabs-apps/source-vue`), depending on
  `@memolabs-apps/source`, `@memolabs-apps/graph` and `@vue/compiler-sfc`.
- `packages/source`: `SourceInspection` gains the discovered collections. No
  exported name is removed and no requirement changes.
- `packages/inspect`: goes from a declared surface to an implementation.
- `packages/cli`: a third command, its parsing, its help text, and the lazy
  loading of the adapter at the composition root.
- `packages/cli` gains a dependency on `@memolabs-apps/inspect` and on
  `@memolabs-apps/source-vue`; `@memolabs-apps/inspect` gains dependencies on
  `@memolabs-apps/source` and `@memolabs-apps/graph`.
- Root `tsconfig.json` references and `pnpm-lock.yaml`.
- `README.md`: the package table and the support matrix move from "no adapter
  has reached any level" to one adapter at `experimental`.
- Not touched: `examples/vue-basic`, the runtime packages, the CI workflows.
- Out of scope and named as such: Nuxt, route extraction from `vue-router`,
  migration decisions, and codemods. Route extraction is deliberately not
  claimed, and the adapter must say so in its findings rather than infer routes
  from a directory convention.
