# Getting started

From nothing to a Navirox app running on a device, and what to do when a step
does not work.

## What you need

| Thing           | Version    | Why                                                      |
| --------------- | ---------- | -------------------------------------------------------- |
| Node.js         | >= 22.13.0 | The whole toolchain. Check with `node --version`.        |
| pnpm            | 11         | `corepack enable` once, then the pinned version is used. |
| Xcode           | current    | iOS builds. Open it once so it accepts its licence.      |
| CocoaPods       | current    | iOS dependencies. `brew install cocoapods`.              |
| The Android SDK | current    | Android builds, with `platform-tools` on `PATH`.         |
| Java            | 17         | The Android Gradle build.                                |
| watchman        | current    | What Metro watches files with. `brew install watchman`.  |

`navirox doctor` checks every one of those and prints the exact command that
fixes what is missing, so the table is a summary rather than a checklist to work
through by hand.

## 1. Create an app

```bash
npm create navirox my-app
cd my-app
pnpm install
```

`create-navirox` copies a working application rather than generating files, so
what you get is the same tree the repository's own example is. The name you pass
becomes the directory, the package name, the iOS target and the Android package
id, so `my-app`, `MyApp` and `"my app"` all work and produce the same identifiers.

Run from the public registry today, this step does scaffold, but the published
`create-navirox` predates the packages it points at: outside this repository
the generated app's Navirox dependencies are written as `0.0.0`, and
`pnpm install` will not resolve them. From 0.1.1 on, once the publication
tracked in issue #17 lands, a generated app records the scaffolder's own
released version instead, so `pnpm install` resolves from the registry with
no checkout present. Until then, the setup that works is the tarball
install `scripts/e2e-scaffold.mjs` performs, described in the next section.

## 2. Check the machine before you build

```bash
npx navirox doctor --platform ios
```

This is the same toolchain check `navirox dev` runs, reported rather than
enforced: one line per tool, `✓` for what is there, `✗` with the fix for what is
not, and `?` for what the command cannot decide. Exit code 0 means go, 2 means a
tool is missing, 3 means something in the app fights the Navirox pipeline.

## Analyze an existing web project

From a Vue, Angular or React project, run:

```bash
npx navirox analyze .
```

The command selects a source adapter from the project manifest and source files,
then reports the framework, routes, components, state, browser capabilities and
the parts it cannot establish. `--json` emits the same report for automation. A
project with competing framework candidates must be selected explicitly, for
example `npx navirox analyze . --framework angular`; Navirox does not guess.

The public `npx` path remains subject to the publication limitation below. The
same command works from a tarball-installed Navirox application today.

## 3. Run it

```bash
npx navirox dev --platform ios      # or --platform android
```

`navirox dev` starts Metro, waits for it to answer, then runs the platform build
and puts the app on the device. It reads the scripts your app already declares
and runs them through the package manager your app's lockfile names, so there is
no second way to start an app.

What you should see, on both platforms:

- a card titled `Reactive Vue, native views`;
- a counter, its `doubled` value, and a `recent:` line once you press it, all
  driven by a Pinia store that two sibling components share;
- a text input bound with `v-model`, whose value appears in a greeting;
- a horizontal strip of chips, an image, and a list of six rows;
- a `Tap` / `Save` / `Clear` panel that calls haptics and the secure store.
  `Save` writes a timestamp, and it is still there after you stop and start the
  app, which is how you know it was kept outside the process.

Android gives you a real device to tap and type on. The iOS simulator renders
everything and answers the secure store, but `simctl` cannot tap, so use Android
when you want to exercise the interaction.

## Two things that will surprise you

**An edit usually hot-updates in place.** Editing a `.vue` single-file component
hands the new component to Vue's HMR runtime, so the app keeps running and the
shared Pinia store keeps its state. The boundary is the component: editing a store
module, any other non-component module, or a style block on its own still reloads
the whole app and resets that state. `PLAN.md` section 10 records the measured
before and after, and `openspec/specs/vue-fast-refresh/spec.md` states the limits.

**Some Navirox packages are not on a registry yet.** This is the one that costs
you time if nobody says it, so here it is plainly. The scaffolder and most
`@memolabs-apps/*` packages resolve at `0.1.0`, but five are not on the public
registry: `@memolabs-apps/cli`, `@memolabs-apps/source-lit`,
`@memolabs-apps/source-solid`, `@memolabs-apps/target-vue` and
`@memolabs-apps/visual-benchmark`. `navirox` itself is not published either, so
`npx navirox` does not resolve against the registry today. Until the set is
complete, an app gets the packages by being pointed at a checkout or at packed
tarballs, and those states behave differently:

| State                      | Installs | Builds | Runs   |
| -------------------------- | -------- | ------ | ------ |
| `link:` to a checkout      | yes      | yes    | **no** |
| `file:` to packed tarballs | yes      | yes    | yes    |
| Published on a registry    | yes      | yes    | yes    |

A `link:` app cannot run because the app and the linked packages end up in two
package stores: Metro then loads two copies of the host runtime, one per store,
and the first symptom is a red screen about a module that was never registered.
`scripts/e2e-scaffold.mjs` is the working reference for the middle state, and it
is what CI runs on every push: it packs the publishable packages, scaffolds an
app outside the workspace, points that app at the tarballs, installs, checks that
every runtime package resolves to exactly one copy, then bundles and builds both
platforms. Run it with `pnpm test:e2e` if you want to see the whole path.

An app installed from tarballs still gets a `navirox` binary, because
`@memolabs-apps/cli` lands in the app's own `node_modules`. `npx navirox doctor`
and `npx navirox dev` resolve against that local copy, so steps 2 and 3 work in a
tarball app even though the package is not on the public registry.

## When something fails

Start with `navirox doctor`. Every `✗` line carries the remedy, and the two
failures it refuses to guess about are the interesting ones:

- `? The compatibility registry` means nothing is checked yet, because the
  registry lands with 0.2. The command says `unknown` rather than implying your
  versions are fine.
- `? The New Architecture` means neither `android/gradle.properties` nor
  `ios/Podfile.properties.json` sets `newArchEnabled`, so this command has
  nothing to read. React Native 0.86 defaults it on; the doctor reports the
  default as unknown rather than reading it as a yes.

If the app builds but shows a red screen naming a module that no one registered,
you are in the `link:` state described above. If Metro cannot resolve a package
at all, the app is outside the workspace while the package is linked into it,
which is the same condition from the other side.

## Where to go next

- `docs/ARCHITECTURE.md`: the layers, the one-way dependency direction, and why
  the renderer is the replaceable part.
- `PLAN.md`: what is built, what is next, and the evidence each claim rests on.
- `docs/evidence/`: the machine-specific facts found during verification.
