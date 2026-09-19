# Navirox architecture

The canonical principle, and the thing every decision below serves:

> Symbiote is a runtime provider, React Native/Fabric is infrastructure, and
> Expo/EAS is an integration. None of them define Navirox's identity.

Everything a user touches is ours: the CLI, routing, the component surface, the
native API surface, the compatibility registry, the migration tooling and the
docs. The renderer underneath is replaceable by design, and this document is
mostly about how that stays true.

## The layers

| Package                           | What it is                                                                         | May import                                                          |
| --------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `@memolabs-apps/runtime`          | The seam. Types, contracts and validation, with no renderer value in it.           | Nothing but Node built-ins and types                                |
| `@memolabs-apps/runtime-symbiote` | The implementation of the seam over Symbiote and React Native.                     | `@memolabs-apps/runtime` and the host, and nothing else may do this |
| `@memolabs-apps/ui`               | The component façade: `FlatList` today, the rest of the surface with each release. | `@memolabs-apps/runtime`                                            |
| `@memolabs-apps/native`           | The native API façade: haptics, secure storage, and the modules 0.2 adds.          | `@memolabs-apps/runtime`                                            |
| `@memolabs-apps/router`           | File-based routing and a generated, typed route manifest (surface declared).       | `@memolabs-apps/runtime`                                            |
| `@memolabs-apps/metro-preset`     | The Vue SFC transform and the CSS parser, composed into one Metro preset.          | Nothing renderer-shaped                                             |
| `@memolabs-apps/cli`              | `navirox dev` and `navirox doctor`.                                                | `@memolabs-apps/doctor`                                             |
| `@memolabs-apps/doctor`           | The environment, runtime and compatibility report.                                 | Nothing renderer-shaped, and nothing from the adapter               |
| `create-navirox`                  | The scaffolder behind `npm create navirox`.                                        | Nothing renderer-shaped                                             |

`@memolabs-apps/compat`, `@memolabs-apps/inspect`, `@memolabs-apps/migrate` and `@memolabs-apps/build`
are declared surfaces with no implementation in 0.1. Their manifests exist so the
layout is settled; they ship with their milestones.

## The dependency direction is one way

```
runtime-symbiote -> runtime
{ui, native, router} -> runtime
{metro-preset, cli, doctor, create-navirox} -> nothing that names a renderer
```

A cycle back into the renderer is the failure this layout exists to prevent: the
moment a component package can reach the adapter, swapping the renderer stops
being a package change and becomes a rewrite.

That rule is enforced rather than documented.
`packages/runtime-symbiote/src/import-boundary.test.ts` walks every package's
source, and fails any file outside the adapter that contains a quoted renderer
package name. A file may mention the renderer in a comment and explain the rule;
it may not name it in code, not even as data. When the doctor needed to report
installed versions, that test is what forced the list to come from the
application's own manifest instead of being spelled out.

`AGENTS.md` states the four rules in full, each with the failure it prevents.
The short version:

1. Only `@memolabs-apps/runtime-symbiote` imports `@symbiote-native/*`, `react-native`,
   or anything else from the Fabric host.
2. Applications import only `@memolabs-apps/*`. Zero `@symbiote-native/*` imports in
   app code, checked by the same boundary test.
3. The dependency direction is one way, as the diagram above says.
4. No public `@memolabs-apps/*` package re-exports a Symbiote type, class, component or
   prop name. Our public API is ours; if a renderer concept leaks into our types,
   the engine stops being swappable.

## How the runtime reaches a component

The adapter installs the runtime into the Vue application under
`RUNTIME_INJECTION_KEY`, a `Symbol.for` key, so two copies of the seam agree on
one key without either of them importing Vue as a value.

The install happens before mount, in the configurator the adapter chains onto the
one the app supplies. `createSymbioteRuntime({ configure })` hands the app to
`configure(app)` after providing the runtime, which is why Pinia can be installed
in the same place: a Pinia instance is per app, and a module-level global would
tie a process to one store when two apps share it.

Façades then read what they need from the runtime instead of importing it:

```ts
const runtime = useRuntime() // throws a sentence if nothing provided one
const list = useRuntimeComponent('flat-list')
const haptics = useHaptics()
const store = useSecureStore()
```

A component therefore names no provider and no renderer. It fails with a sentence
that says what is missing, which is what a component built on a runtime that does
not provide it should do.

## Tags and components

`view`, `text`, `pressable`, `text-input`, `scroll-view`, `image` and
`horizontal-scroll-view` are intrinsic tags. The Vue transform compiles a
lowercase hyphenated tag into an element the engine resolves, so an app renders
them with no import at all, and a scroll view's axis is the tag rather than a
prop, because the two axes use different native view managers.

A list is not a tag. It virtualizes, so it owns state and windowing, which makes
it a component rather than an element. `FlatList` comes from `@memolabs-apps/ui`, and
resolves the engine's list through the seam.
The renderer's own prop surface stays in the adapter; the façade publishes our
props, passes anything else through untouched, and never re-exports a renderer
type.

## Native modules

The seam declares the contracts (`haptics`, `secure-store`) as plain string ids
plus shapes, because the adapter may not import the façade and the façade must
not know which provider is behind it. Every method resolves rather than rejecting
on a device that has no motor or no keychain, since that is not something an app
can act on.

The provider packages are declared by the application's manifest and imported by
the adapter. That split was measured, not preferred: React Native's autolinking
only sees a native module that the application's own manifest names, so with the
two packages declared by the adapter alone the generated `autolinking.json`
listed no dependencies at all and the modules were never linked. The application
declares them; the application's code never imports them.

## An application

`index.js` builds the runtime and mounts the app:

```js
const runtime = createSymbioteRuntime({ configure: (app) => app.use(createPinia()) })
runtime.mount(App, { name: appName })
```

`App.vue` is a `<script setup lang="ts">` single file component that imports only
`@memolabs-apps/*`. The manifest declares the Navirox packages and the native provider
packages, and carries its own `pnpm-workspace.yaml` because that is where pnpm
keeps its settings now.

## The toolchain

`@memolabs-apps/metro-preset` composes the Vue SFC transform and the CSS parser into
one preset, so a `.vue` file and its `<style>` block both reach the bundle. The
template's `metro.config.js` is two lines on top of the plain React Native
config, and deliberately carries no workspace wiring: a published app installs
everything inside its own root.

`create-navirox` copies the template, which is the same tree as
`examples/vue-basic`, rewrites the identity, and then decides how the app will
get the Navirox packages. While they are unpublished it links them from the
checkout and says so, because a version range pointing at a registry that has
nothing to give would not install.

`@memolabs-apps/doctor` asks whether the machine, the app and the runtime agree. It
reads files rather than importing the renderer, which is why the compatibility
registry reports `unknown` with its reason until it lands in 0.2, and why a
check that cannot be decided is never reported as a pass.

From workspace source to a published install, there are three states:

1. **Linked.** The scaffolder links `@memolabs-apps/*` from the checkout. This works
   for building and bundling, and it cannot run: the app and the linked packages
   sit in two different package stores, so Metro loads two copies of the host
   runtime and the app dies on a module registry that never saw the caller.
2. **Packed artifacts.** `pnpm pack` each package, install the archives into an
   app outside the workspace. One copy of every runtime package, resolved inside
   the app. This is what `scripts/e2e-scaffold.mjs` runs in CI, and it is the
   shape a stranger gets from a registry.
3. **Published.** The app installs `@memolabs-apps/*` from the registry with no
   coordination, and the linked and packed variants disappear.

## Evidence

`docs/evidence/` records machine-specific build facts. They are load-bearing
because rediscovering them costs hours, and they are shaped as claims with the
run that produced them rather than as instructions. `PLAN.md` section 2 records
where the blueprint was corrected against the real upstream, and behaviour is
read from the upstream source rather than recalled.

## Not in 0.1

The README lists what 0.1 deliberately leaves out, including EAS and OTA, and why
the ship backend is the raw toolchain plus Fastlane instead.
