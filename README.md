# Navirox

[![CI](https://github.com/guillaume-flambard/navirox/actions/workflows/ci.yml/badge.svg)](https://github.com/guillaume-flambard/navirox/actions/workflows/ci.yml)

**The native mobile stack for Vue teams.**

Build real iOS and Android apps without leaving Vue. Keep your Vue 3 components,
Composition API, `<script setup>`, Pinia stores, TypeScript types, API clients
and validation. Ship a genuinely native app.

> **Status: pre-alpha.** Nothing here is published. The monorepo is a skeleton
> and the product does not work end to end yet. The roadmap in `PLAN.md` is the
> honest picture of what exists.

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

## Repository layout

`packages/` holds the stack. `PLAN.md` section 6 describes what each package is
for and section 7 fixes the allowed dependency direction.

## Working on Navirox

Node 22.13 or newer, and pnpm 11. Run `corepack enable` once and the version
pinned in `package.json` does the rest.

```bash
pnpm install
pnpm build
pnpm test
```

Read `AGENTS.md` before changing anything. It lists the architectural rules that
the test suite enforces.

## Contributing

`CONTRIBUTING.md` has the setup, the full gate suite and the architectural rules
that account for most review comments. Participation is covered by
`CODE_OF_CONDUCT.md`.

Please send security problems through private reporting rather than a public
issue. `SECURITY.md` has the link.

## License

MIT. See `LICENSE`.
