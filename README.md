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

**Pre-alpha. The product does not work end to end yet, and a public `npm
install` is not demonstrated: publication is partial.**

The native path is real: a generated Vue app installs from packed tarballs
outside the workspace, boots on both platforms, and drives a shared Detox journey
that passes in CI. The source path, which is the part that makes Navirox
framework-agnostic rather than a single-framework tool, is being built now.

Publication is not finished. The scaffolder and 26 of the 28 scoped packages
resolve at `0.1.0`; `@memolabs-apps/cli`, `@memolabs-apps/source-lit` and
`@memolabs-apps/source-solid` are not on the registry yet, so `npx navirox`
against the public registry does not resolve. The validated pre-publication path
is the tarball install that `scripts/e2e-scaffold.mjs` performs, which CI runs on
every push. `docs/evidence/release-candidate-2026-09-19.md` records the exact
registry state and the verification behind it.

Two documents split the truth deliberately. `docs/repositioning/` defines where
the product is going. `PLAN.md` remains the implementation evidence for the Vue
and runtime path, and it stays valid as evidence even where it predates the
repositioning; its top note dates the statements that later work superseded.

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

The **runtime seam** is implemented and enforced. `@memolabs-apps/runtime` is the one
interface every public Navirox package depends on, and
`@memolabs-apps/runtime-symbiote` is the only package allowed to import the renderer.
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

| Level        | What it claims                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Experimental | Detection, inspection and a generic migration plan exist, but no framework-specific migration transform and no migrated app built from it. |
| Preview      | A partial migration exists for that framework: at least one transform produces code, with gaps reported honestly.                          |
| Supported    | A migrated application in that framework builds and runs on a target.                                                                      |
| Production   | Supported, plus a release process and a compatibility record with evidence.                                                                |

**Twelve adapters are at Experimental.** Vue 3, Nuxt, Svelte, SvelteKit, Angular,
React, Next, Astro, Solid, Qwik, Lit and vanilla HTML/CSS/JS are detected,
inspected, and planned for by one generic planner. Nothing converts a native view:
the only migration transform that exists copies the units the planner classifies
`shared` byte for byte, and there is no framework-specific transform yet. Vue
reads literal top-level routes passed directly to `createRouter`; computed,
nested and plugin-defined routes are reported rather than guessed. Nuxt reads the
application directory Nuxt 4 documents, the `definePageMeta` macro and the two halves of a
component, and its data calls stay one shared capability rather than a model of their own.
Qwik reads Qwik City's route conventions, including pathless groups and named layouts,
and reports the surface it does not model instead of guessing at it.
Lit reads custom elements in both the shapes the platform documents, keeps reactive
properties as adapter metadata, and reads routes from the code a project writes because
Lit ships no router of its own.
Vanilla is the only adapter claimed by what a project does not declare: it reads documents
as routes at the addresses a host serves them from, reads the modules those documents run,
and reports the page's own script and the routing done at runtime instead of parsing either.
The server side of Nuxt, SvelteKit and Astro is reported rather than modelled. Every
framework below them is still a plan. There is no green checkmark on this page for an
adapter that does not exist.

| Source              | Detection   | Inspection  | Migration plan | Level           |
| ------------------- | ----------- | ----------- | -------------- | --------------- |
| Vue 3               | implemented | implemented | implemented    | Experimental    |
| Nuxt                | implemented | implemented | implemented    | Experimental    |
| Svelte              | implemented | implemented | implemented    | Experimental    |
| SvelteKit           | implemented | implemented | implemented    | Experimental    |
| Angular             | implemented | implemented | implemented    | Experimental    |
| React               | implemented | implemented | implemented    | Experimental    |
| Next                | implemented | implemented | implemented    | Experimental    |
| Astro               | implemented | implemented | implemented    | Experimental    |
| Solid               | implemented | implemented | implemented    | Experimental    |
| Qwik                | implemented | implemented | implemented    | Experimental    |
| Lit                 | implemented | implemented | implemented    | Experimental    |
| Vanilla HTML/CSS/JS | implemented | implemented | implemented    | Experimental    |
| React Router, Remix | planned     | planned     | planned        | Not yet claimed |

What each adapter reports, and what it deliberately does not, is recorded in
`docs/evidence/`: the Vue reading of the acceptance app and the cross-adapter
gate that puts two frameworks through one pipeline. The `Migration plan` column
means the generic plan every adapter gets from the shared planner; it is not a
per-framework transform. Framework-specific transforms are roadmap Stage E, and
today the only transform is `copy-movable-unit`, which copies the units the plan
classified `shared` or `portable` and reports the imports it did not carry.

## Packages

`packages/` holds the stack. The dependency direction is one way, and a cycle
back into the renderer is the failure mode this layout exists to prevent.

| Package                           | What it is                                                                                                                           | State                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `@memolabs-apps/runtime`          | The runtime seam. The single interface every public Navirox package depends on.                                                      | Implemented                                                      |
| `@memolabs-apps/runtime-symbiote` | The Symbiote-backed implementation of the seam. The only package allowed to import `@symbiote-native/*`.                             | Implemented                                                      |
| `@memolabs-apps/graph`            | The framework-neutral App Graph schema and its deterministic node identifiers.                                                       | Implemented                                                      |
| `@memolabs-apps/source`           | The source adapter contract, the adapter registry, and the framework import boundary that keeps the core neutral.                    | Implemented                                                      |
| `@memolabs-apps/source-vue`       | The Vue source adapter: detection, single file component inspection, and App Graph construction.                                     | Implemented, experimental                                        |
| `@memolabs-apps/target-vue`       | The narrow Vue template compiler: safe primitives emit native source; unsupported constructs are reported and block emission.        | Implemented, pre-visual-fidelity proof                           |
| `@memolabs-apps/source-nuxt`      | The Nuxt source adapter: the Nuxt 4 application directory, filesystem routes, the page macro, and the two halves of a component.     | Implemented, experimental                                        |
| `@memolabs-apps/source-svelte`    | The Svelte source adapter: detection, component inspection, and App Graph construction.                                              | Implemented, experimental                                        |
| `@memolabs-apps/source-sveltekit` | The SvelteKit source adapter: filesystem route extraction on top of the Svelte adapter.                                              | Implemented, experimental                                        |
| `@memolabs-apps/source-angular`   | The Angular source adapter: decorator-driven components and services, and routes read from a routes file.                            | Implemented, experimental                                        |
| `@memolabs-apps/source-react`     | The React source adapter: components found by what a module exports, stores by declaration, and a native project refused.            | Implemented, experimental                                        |
| `@memolabs-apps/source-next`      | The Next source adapter: both routers, layouts and the module boundary, on top of the React adapter.                                 | Implemented, experimental                                        |
| `@memolabs-apps/source-astro`     | The Astro source adapter: pages, islands, and the framework components handed to the adapters that read them.                        | Implemented, experimental                                        |
| `@memolabs-apps/source-solid`     | The Solid source adapter: components read by what a module exports, stores from `solid-js/store`, and the router's two shapes.       | Implemented, experimental                                        |
| `@memolabs-apps/source-qwik`      | The Qwik source adapter: `component$` boundaries, Qwik City routes, and the surface it reports rather than reads.                    | Implemented, experimental                                        |
| `@memolabs-apps/source-lit`       | The Lit source adapter: custom elements in both documented shapes, reactive properties, and the routes a project declares in code.   | Implemented, experimental                                        |
| `@memolabs-apps/source-vanilla`   | The vanilla HTML/CSS/JS source adapter: documents as routes, modules as units, and the absences of a framework reported as absences. | Implemented, experimental                                        |
| `@memolabs-apps/metro-preset`     | The Vue SFC transform and the CSS parser, composed into one Metro preset.                                                            | Implemented                                                      |
| `@memolabs-apps/ui`               | Curated native component facade: View, Text, Pressable, ScrollView, TextInput, FlatList.                                             | Implemented                                                      |
| `@memolabs-apps/native`           | Vue-first native API surface over a pluggable provider. Haptics and secure storage today.                                            | Implemented                                                      |
| `@memolabs-apps/router`           | File-based routing plus a generated, fully typed route manifest.                                                                     | Implemented                                                      |
| `@memolabs-apps/cli`              | The `navirox` command line interface.                                                                                                | `analyze`, `dev`, `doctor`, `inspect`, `plan` and `migrate` work |
| `navirox`                         | Public launcher for `npx navirox`, delegating to the CLI package.                                                                    | Implemented, awaiting publication                                |
| `create-navirox`                  | Scaffolder invoked by `npm create navirox`.                                                                                          | Implemented                                                      |
| `@memolabs-apps/doctor`           | Environment and dependency diagnostics behind `navirox doctor`.                                                                      | Implemented                                                      |
| `@memolabs-apps/config`           | `defineNaviroxConfig` and its schema.                                                                                                | Declared                                                         |
| `@memolabs-apps/inspect`          | The framework-neutral inspection pipeline: adapter selection, App Graph assembly and the versioned report.                           | Implemented                                                      |
| `@memolabs-apps/planner`          | The migration decision model, the rule engine and the generic rules that turn an App Graph into a plan.                              | Implemented                                                      |
| `@memolabs-apps/migrate`          | The migration engine: a versioned state file, a transform pipeline, a dry run by default and a rollback.                             | Implemented, copies shared logic                                 |
| `@memolabs-apps/compat`           | Compatibility records: what Navirox knows works on a native target, and the evidence behind each claim.                              | Implemented, seeded                                              |
| `@memolabs-apps/build`            | Build, update and submit orchestration through a replaceable provider.                                                               | Declared                                                         |

`examples/vue-basic` is the acceptance app: a Vue SFC application that imports
only `@memolabs-apps/*` and one line of Metro config. It is judged against the renderer
and the preset, it carries the shared Detox journey, and it resolves this
repository's code through `workspace:*` rather than through the registry, which
does not carry every package yet. The tarball path `scripts/e2e-scaffold.mjs`
exercises is the one that stands in for a public install.

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

Two items that belong to the Vue path have since landed. Fast Refresh ships for
`<script setup>` SFCs: editing a component hot-updates it in place and the shared
store keeps its state across that update. The boundary is the component, so a
store-module edit, or a style-block-only change, still reloads the app whole.
The release process also exists: `0.1.0` is tagged and the packages carry a
changeset-generated changelog. Publication itself is partial, as the top of this
file says, and `docs/evidence/release-candidate-2026-09-19.md` records what the
release did and did not do.

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
| `docs/GO-TO-MARKET.md`    | Truthful market-entry plan: feedback, visibility and paid discovery |
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
