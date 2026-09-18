# Navirox

[![CI](https://github.com/guillaume-flambard/navirox/actions/workflows/ci.yml/badge.svg)](https://github.com/guillaume-flambard/navirox/actions/workflows/ci.yml)
[![CodeQL](https://github.com/guillaume-flambard/navirox/actions/workflows/codeql.yml/badge.svg)](https://github.com/guillaume-flambard/navirox/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Status: pre-alpha](https://img.shields.io/badge/status-pre--alpha-orange.svg)](#status)

**The framework-agnostic Web to Native Mobile platform. Vue first.**

Navirox analyses an existing web application, builds a framework-neutral model of
the parts that matter for a mobile migration, classifies each part by the
strategy that fits it, and helps produce a native mobile application that keeps
as much of the original logic as the platform honestly allows.

Said the short way, the way a person would say it: **turn existing web
applications into native mobile applications.**

## Status

**Pre-alpha. Nothing here is published, and the product does not work end to
end yet.**

The native path is real: a generated Vue app installs from published package
artifacts, boots on both platforms, and drives a shared Detox journey that passes
in CI. The source path, which is the part that makes Navirox framework-agnostic
rather than a single-framework tool, is being built now.

Two documents split the truth deliberately. `docs/repositioning/` defines where
the product is going. `PLAN.md` remains the implementation evidence for the Vue
and runtime path, and it stays valid as evidence even where it predates the
repositioning.

## Why

A team with a working web application that needs iOS and Android currently picks
between four bad options:

| Path         | The cost                                                   |
| ------------ | ---------------------------------------------------------- |
| React Native | A second stack, and React expertise the team does not have |
| Flutter      | Dart, and a rewrite of everything                          |
| Capacitor    | A WebView, with the native-UI compromise that implies      |
| NativeScript | Another ecosystem to learn and staff                       |

None of them answers the question those teams actually have. It is not "can this
framework render natively", it is: **what in this codebase can move, what has to
adapt, and what should become native?** That question is answerable by analysis,
before a line of mobile code is written, and the answer does not depend on which
framework the web app happens to use.

## Architecture

There are two seams, not one.

```
Your web application (Vue, Nuxt, Svelte, Angular, React, Astro, ...)
  -> source adapters     the source seam. Framework knowledge stops here.
  -> Navirox core        App Graph, compatibility, planning, migration
  -> target provider     the native or generated target
  -> runtime adapter     the runtime seam. Today: Symbiote
  -> React Native Fabric
  -> iOS and Android
```

The **runtime seam** is implemented and enforced. `@navirox/runtime` is the one
interface every public Navirox package depends on, and
`@navirox/runtime-symbiote` is the only package allowed to import the renderer.
Swapping the renderer must not change the CLI, the routing, the public API, the
compatibility data or your application code.

The **source seam** is being introduced. A source adapter owns everything
specific to one web framework and returns a framework-neutral App Graph. The
core that consumes that graph must never import a framework, so a second adapter
is a data change rather than a rewrite. Both boundaries are enforced by a test,
not by good intentions.

Symbiote is a runtime provider, React Native/Fabric is infrastructure, and
Expo/EAS is an integration. None of them define Navirox's identity.

## Source support

Support is declared per source framework and per capability, never as a single
marketing badge. The four levels are the ones the roadmap defines:

| Level        | What it claims                                                              |
| ------------ | --------------------------------------------------------------------------- |
| Experimental | Detection exists. Nothing beyond detection is claimed.                      |
| Preview      | Inspection and a migration plan are produced, with gaps reported honestly.  |
| Supported    | A migrated application in that framework builds and runs on a target.       |
| Production   | Supported, plus a release process and a compatibility record with evidence. |

**Four adapters are at Experimental.** Vue 3, Nuxt, Svelte and SvelteKit are
detected and inspected, and nothing beyond that is claimed: no migration transform
exists, plain Vue routes are not extracted, and the server side of Nuxt and
SvelteKit is reported rather than modelled. Every framework below them is still a
plan. There is no green checkmark on this page for an adapter that does not
exist.

| Source                           | Detection   | Inspection  | Migration plan | Level           |
| -------------------------------- | ----------- | ----------- | -------------- | --------------- |
| Vue 3                            | implemented | implemented | planned        | Experimental    |
| Nuxt                             | implemented | implemented | planned        | Experimental    |
| Svelte                           | implemented | implemented | planned        | Experimental    |
| SvelteKit                        | implemented | implemented | planned        | Experimental    |
| Angular                          | planned     | planned     | planned        | Not yet claimed |
| React, Next, React Router, Remix | planned     | planned     | planned        | Not yet claimed |
| Astro                            | planned     | planned     | planned        | Not yet claimed |

What each adapter reports, and what it deliberately does not, is recorded in
`docs/evidence/`: the Vue reading of the acceptance app and the cross-adapter
gate that puts two frameworks through one pipeline.

## Packages

`packages/` holds the stack. The dependency direction is one way, and a cycle
back into the renderer is the failure mode this layout exists to prevent.

| Package                     | What it is                                                                                                        | State                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `@navirox/runtime`          | The runtime seam. The single interface every public Navirox package depends on.                                   | Implemented                                |
| `@navirox/runtime-symbiote` | The Symbiote-backed implementation of the seam. The only package allowed to import `@symbiote-native/*`.          | Implemented                                |
| `@navirox/graph`            | The framework-neutral App Graph schema and its deterministic node identifiers.                                    | Implemented                                |
| `@navirox/source`           | The source adapter contract, the adapter registry, and the framework import boundary that keeps the core neutral. | Implemented                                |
| `@navirox/source-vue`       | The Vue source adapter: detection, single file component inspection, and App Graph construction.                  | Implemented, experimental                  |
| `@navirox/source-nuxt`      | The Nuxt source adapter: filesystem routes, layouts and composables, on top of the Vue adapter.                   | Implemented, experimental                  |
| `@navirox/source-svelte`    | The Svelte source adapter: detection, component inspection, and App Graph construction.                           | Implemented, experimental                  |
| `@navirox/source-sveltekit` | The SvelteKit source adapter: filesystem route extraction on top of the Svelte adapter.                           | Implemented, experimental                  |
| `@navirox/metro-preset`     | The Vue SFC transform and the CSS parser, composed into one Metro preset.                                         | Implemented                                |
| `@navirox/ui`               | Curated native component facade: View, Text, Pressable, ScrollView, TextInput, FlatList.                          | Implemented                                |
| `@navirox/native`           | Vue-first native API surface over a pluggable provider. Haptics and secure storage today.                         | Implemented                                |
| `@navirox/router`           | File-based routing plus a generated, fully typed route manifest.                                                  | Implemented                                |
| `@navirox/cli`              | The `navirox` command line interface.                                                                             | `dev`, `doctor`, `inspect` and `plan` work |
| `create-navirox`            | Scaffolder invoked by `npm create navirox`.                                                                       | Implemented                                |
| `@navirox/doctor`           | Environment and dependency diagnostics behind `navirox doctor`.                                                   | Implemented                                |
| `@navirox/config`           | `defineNaviroxConfig` and its schema.                                                                             | Declared                                   |
| `@navirox/inspect`          | The framework-neutral inspection pipeline: adapter selection, App Graph assembly and the versioned report.        | Implemented                                |
| `@navirox/planner`          | The migration decision model, the rule engine and the generic rules that turn an App Graph into a plan.           | Implemented                                |
| `@navirox/migrate`          | Codemods that move web source onto a native target.                                                               | Declared                                   |
| `@navirox/compat`           | Compatibility records: what Navirox knows works on a native target, and the evidence behind each claim.           | Implemented, seeded                        |
| `@navirox/build`            | Build, update and submit orchestration through a replaceable provider.                                            | Declared                                   |

`examples/vue-basic` is the acceptance app: a Vue SFC application that imports
only `@navirox/*` and one line of Metro config. It is judged against the renderer
and the preset, it carries the shared Detox journey, and it resolves this
repository's code through `workspace:*` rather than a registry that has nothing
to publish yet.

## Quickstart

Node 22.13 or newer, and pnpm 11. Run `corepack enable` once and the version
pinned in `package.json` does the rest.

```bash
pnpm install
pnpm build
pnpm test
```

The full gate suite is in `CONTRIBUTING.md`. Read `AGENTS.md` before changing
anything: it lists the architectural rules the test suite enforces, and most
review comments come back to one of them. To build an app rather than work on
Navirox, start with `docs/GETTING-STARTED.md`.

## Roadmap

The repositioning happens in stages, and each stage has a gate rather than a
date. Vue becomes the first adapter behind a generic contract; Svelte and
SvelteKit are the architectural proof that the contract is genuinely
framework-neutral; Nuxt adds migration depth on top of Vue; Angular, React and
Astro come later, and only after the proof. `docs/repositioning/ROADMAP.md` has
the stages and their exit criteria.

The renderer, the runtime seam, the Metro preset, the scaffolder, `navirox dev`
and `navirox doctor` are done. The compatibility registry, the compatibility
schema and the migration codemods are ordered in `PLAN.md` with their
dependencies.

## Not in 0.1

0.1 is the canary: a generated app that installs, runs on both platforms, and
reports honestly on the machine it runs on. These are deliberately not here yet:
EAS and OTA, camera, location and notifications, Nuxt migration, the
compatibility registry UI, Vue DevTools, Tailwind, Reanimated, and Windows or
Linux hosts for native builds.

Two items that belong to the Vue path are recorded and deferred rather than
forgotten: Fast Refresh for SFCs and stores, and the release process that tags
`0.1.0` through changesets. Both sit in `PLAN.md` at the definition of done, and
neither is claimed as done.

The ship backend deserves its own line, because it is where this plan knowingly
departs from the blueprint. `navirox submit` will drive the raw Xcode and Gradle
toolchain through Fastlane rather than EAS, and `navirox update` will report what
it cannot do instead of pretending: over-the-air updates on a bare React Native
app need a bundle update mechanism Navirox does not have yet. Promising EAS and
not shipping it is the fastest way to lose the teams this is built for.

## Documentation

| Document                  | What is in it                                                       |
| ------------------------- | ------------------------------------------------------------------- |
| `docs/repositioning/`     | The canonical repositioning set: product, architecture and the plan |
| `docs/GETTING-STARTED.md` | Prerequisites, the first app, and what to do when it fails          |
| `docs/ARCHITECTURE.md`    | The layers, the runtime seam, and the dependency direction          |
| `PLAN.md`                 | Implementation evidence and task order for the Vue and runtime path |
| `blueprint.md`            | The original product and technical blueprint                        |
| `AGENTS.md`               | The architectural contract, and the rules the tests enforce         |
| `docs/evidence/`          | Machine-specific build facts established during verification        |

Inside `docs/repositioning/`, the order that matters is `AGENT-GUIDE.md`,
`ARCHITECTURE.md`, `MIGRATION-PLAN.md`, then `PRD.md`, `BLUEPRINT.md` and
`ROADMAP.md`. `POSITIONING.json` is the machine-readable form of the same
decision.

## Contributing

`CONTRIBUTING.md` has the setup, the gate suite and the architectural rules.
Participation is covered by `CODE_OF_CONDUCT.md`. Questions and ideas belong in
[Discussions](https://github.com/guillaume-flambard/navirox/discussions).

## Security

Please report vulnerabilities through private reporting rather than a public
issue. `SECURITY.md` has the link and what to include.

## License

MIT. See `LICENSE`.
