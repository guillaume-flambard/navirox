# Navirox

[![CI](https://github.com/guillaume-flambard/navirox/actions/workflows/ci.yml/badge.svg)](https://github.com/guillaume-flambard/navirox/actions/workflows/ci.yml)
[![CodeQL](https://github.com/guillaume-flambard/navirox/actions/workflows/codeql.yml/badge.svg)](https://github.com/guillaume-flambard/navirox/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Status: pre-alpha](https://img.shields.io/badge/status-pre--alpha-orange.svg)](#status)

**The native mobile stack for Vue teams.**

Build real iOS and Android apps without leaving Vue. Keep your Vue 3 components,
Composition API, `<script setup>`, Pinia stores, TypeScript types, API clients
and validation. Ship a genuinely native app.

## Status

**Pre-alpha. Nothing here is published, and the product does not work end to
end yet.** Three packages have real code, the rest are declared surfaces with an
identity test and no implementation. `PLAN.md` is the plan of record and the
honest picture of what exists and in what order it gets built. If you are
looking for something to use today, this is not it yet.

## Why

A Vue or Nuxt team that needs iOS and Android currently picks a bad option:

| Path         | The cost                                                  |
| ------------ | --------------------------------------------------------- |
| React Native | A new stack, and React expertise the team does not have   |
| Flutter      | Dart, and a rewrite of everything                         |
| Capacitor    | A WebView, with all the native-UI compromise that implies |
| NativeScript | Another ecosystem to learn and staff                      |

Navirox is the answer to a narrower and more honest question than "can Vue
render natively". It is: **can a Vue team add mobile without changing its
stack?** Share the TypeScript types, the API client, the validation, the
business rules, the Pinia stores and the composables. Write the truly native
layer twice, because that layer is genuinely different.

## Architecture

```
Your Vue app
  -> Navirox            CLI, routing, components, native APIs, compatibility, migration
  -> Runtime adapter    the seam. Today: Symbiote
  -> React Native Fabric
  -> iOS and Android
```

The runtime adapter is an implementation detail. Swapping it must not change the
CLI, the routing, the public API, the compatibility data or your application
code. That constraint is enforced by a test, not by good intentions.

Symbiote is a runtime provider, React Native/Fabric is infrastructure, and
Expo/EAS is an integration. None of them define Navirox's identity.

## Packages

`packages/` holds the stack. The dependency direction is one way, and a cycle
back into the renderer is the failure mode this layout exists to prevent.

| Package                     | What it is                                                                                               | State            |
| --------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------- |
| `@navirox/runtime`          | The runtime seam. The single interface every public Navirox package depends on.                          | Implemented      |
| `@navirox/runtime-symbiote` | The Symbiote-backed implementation of the seam. The only package allowed to import `@symbiote-native/*`. | Implemented      |
| `@navirox/metro-preset`     | The Vue SFC transform and the CSS parser, composed into one Metro preset.                                | Implemented      |
| `@navirox/ui`               | Curated native component facade: View, Text, Pressable, ScrollView, TextInput, FlatList.                 | Surface declared |
| `@navirox/native`           | Vue-first native API surface (haptics, storage, camera, location) over a pluggable provider.             | Surface declared |
| `@navirox/router`           | File-based routing plus a generated, fully typed route manifest.                                         | Surface declared |
| `@navirox/config`           | `defineNaviroxConfig` and its schema.                                                                    | Declared         |
| `@navirox/cli`              | The `navirox` command line interface.                                                                    | Declared         |
| `create-navirox`            | Scaffolder invoked by `npm create navirox`.                                                              | Declared         |
| `@navirox/doctor`           | Environment and dependency diagnostics behind `navirox doctor`.                                          | Declared         |
| `@navirox/inspect`          | Native-readiness detection and classification behind `navirox inspect`.                                  | Declared         |
| `@navirox/migrate`          | AST-based codemods that move Vue and Nuxt code onto the native stack.                                    | Declared         |
| `@navirox/compat`           | Compatibility registry schema, loading and queries.                                                      | Declared         |
| `@navirox/build`            | Build, update and submit orchestration for iOS and Android.                                              | Declared         |

`examples/vue-basic` is the acceptance app: a Vue SFC application that imports
only `@navirox/*` and one line of Metro config. It is judged against the
renderer and the preset, and it resolves this repository's code through
`workspace:*` rather than a registry that has nothing to publish yet.

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
review comments come back to one of them.

## Roadmap

`PLAN.md` holds the task list. The renderer, the runtime seam and the Metro
preset are done; the scaffolder and `navirox dev` are next, because the upstream
project this wraps once documented that the quickest way to try it was to run an
example rather than a published scaffolder, and no scaffolder exists. Everything
after that, from `navirox doctor` to the compatibility registry and the migration
codemods, is ordered in `PLAN.md` with its dependencies.

## Documentation

| Document         | What is in it                                                |
| ---------------- | ------------------------------------------------------------ |
| `PLAN.md`        | The plan of record: scope, package roles, task order         |
| `blueprint.md`   | The full product and technical blueprint                     |
| `AGENTS.md`      | The architectural contract, and the rules the tests enforce  |
| `docs/evidence/` | Machine-specific build facts established during verification |

## Contributing

`CONTRIBUTING.md` has the setup, the gate suite and the architectural rules.
Participation is covered by `CODE_OF_CONDUCT.md`. Questions and ideas belong in
[Discussions](https://github.com/guillaume-flambard/navirox/discussions).

## Security

Please report vulnerabilities through private reporting rather than a public
issue. `SECURITY.md` has the link and what to include.

## License

MIT. See `LICENSE`.
