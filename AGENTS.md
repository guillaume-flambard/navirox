# AGENTS.md - Navirox

Instructions for any AI agent working in this repository. This file is the local
contract. `docs/repositioning/` is the canonical statement of product direction,
and `PLAN.md` remains the implementation evidence for the Vue and runtime path.

## What this project is

Navirox is the framework-agnostic Web to Native Mobile platform. It analyses an
existing web application, builds a framework-neutral model of the parts that
matter for a mobile migration, classifies each part by the strategy that fits it,
and helps produce a native mobile application that keeps as much of the original
logic as the platform honestly allows. Said the short way: turn existing web
applications into native mobile applications. Vue 3 is the current execution
wedge, not the identity.

Canonical principle. Do not paraphrase it away:

> Symbiote is a runtime provider, React Native/Fabric is infrastructure, and
> Expo/EAS is an integration. None of them define Navirox's identity.

No framework and no renderer defines the identity either. A source framework
reaches Navirox only through a source adapter, and a renderer only through the
runtime seam. Everything a user touches is ours: the CLI, routing, the component
surface, the native API surface, the compatibility registry, the migration
tooling and the docs. Both seams are replaceable by design.

## Hard architectural rules

1. **`@navirox/runtime-symbiote` is the only package allowed to import
   `@symbiote-native/*`**, `react-native`, or anything else from the Fabric host.
   Every other package depends on the seam in `@navirox/runtime`, never on a
   particular implementation of it.
2. **Applications import only `@navirox/*`.** Zero `@symbiote-native/*` imports
   in app code. This is Proof B in `PLAN.md` section 8 and it is enforced by an
   import-boundary test, not by convention.
3. **The dependency direction is one way.**
   `runtime-symbiote -> runtime` and `{ui,native,router} -> runtime`. The
   toolchain packages (`compat`, `doctor`, `inspect`, `migrate`, `build`, `cli`)
   must not reach Symbiote at all. Cycles back into the renderer are the failure
   mode this whole layout exists to prevent.
4. **Never re-export a Symbiote type, class, component or prop name** from a
   public `@navirox/*` package. Our public API is ours. If a Symbiote concept
   leaks into our types, the engine stops being swappable.
5. **Do not promise 100% shared UI.** The shared layer is types, API clients,
   validation, business rules, stores and composables. The view layer is
   rewritten. Section 9 of `blueprint.md` splits code into shared, adaptable and
   platform-specific, and the tooling must respect that split.
6. **The source seam is neutral in both directions.** Framework knowledge lives
   in a source adapter and nowhere else. A framework-neutral package (`graph`,
   `source` outside the adapters, `compat`, `inspect`, `migrate`, `config`,
   `build`, `doctor`, `cli`) must never import a source framework or its compiler
   packages, and a source adapter must never import a target provider. The
   forbidden list is declared once, in `@navirox/source`, and a static check
   fails the build when a neutral package reaches across the line. The same
   reasoning as rule 1, applied to the other seam.

## Commands

```bash
pnpm install          # install the workspace
pnpm build            # turbo, honours TS project references
pnpm typecheck        # turbo
pnpm test             # turbo, vitest in each package
pnpm lint             # eslint over packages/*/src
pnpm format           # prettier --write
pnpm deps:check       # syncpack lint (version drift guard)
pnpm changeset        # record a change for release
```

`pnpm build && pnpm test` green is the baseline. Do not leave the workspace red.

## Toolchain decisions that are deliberate

- **pnpm is pinned to the 11.x line** via `packageManager` in `package.json`.
  The plan requires 11.x; this machine's global pnpm is 12.x, so corepack is the
  way pnpm 11 gets used. Do not "fix" this by moving to 12.
- **TypeScript is pinned to `~6.0.3`**, not the newest release.
  `typescript-eslint@8` declares a peer of `>=4.8.4 <6.1.0`, so the TypeScript 7
  line cannot be used until that peer widens. This matches upstream
  SymbioteNative's own `~6.0.0` pin.
- **Node floor is 22.13.0**, matching upstream. This machine runs 24.x.
- **Symbiote packages are pinned exactly, never ranged.** Their version lines
  move independently (`@symbiote-native/vue` is 2.x while
  `@symbiote-native/navigation` is 4.x), and upstream documents a concrete
  failure caused by a floating range: a newer `react-native-screens` than the
  vendored codegen specs produced `error: no type named RNSSplitHostColorScheme`
  at pod install. Exact pins are the guard.

## Adding an external dependency

Every new runtime dependency that Navirox itself ships must be recorded with its
version and the reason it exists. A dependency added without a recorded pin is a
dependency added by accident. Upstream churns fast; the record is what lets us
tell drift from breakage.

## Evidence over recall

This project wraps a fast-moving upstream that is younger than the plan. Do not
state how Symbiote behaves from memory. Read `PLAN.md` section 2, which records
where the blueprint's assumptions were corrected against the real upstream, and
check the upstream source at `~/projects/upstream/symbiote-native` before
asserting behavior. Machine-specific build facts discovered during G0 are
recorded in `docs/evidence/` and are load-bearing, especially the Android
single-ABI rule.

## License

MIT is the working default. `blueprint.md` section 40 leaves the final choice to
be made after a dependency review, and `lightningcss` in the CSS pipeline is
MPL-2.0, which is fine to depend on but not to vendor or patch. Do not add a
vendored copy of an MPL-2.0 dependency.
