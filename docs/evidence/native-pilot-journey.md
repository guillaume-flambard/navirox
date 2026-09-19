# The migrated pilot, running on both native platforms

This is the evidence for issue #14. It records one web application carried to
native by the shipped CLI, the work the run left behind, and the same acceptance
journey passing on an iOS simulator and an Android emulator.

## Revisions

- Web source: `pilots/vue-web`, committed at `8bc0552` (issue #12), a pinned
  `create-vue@3.24.0` app with TypeScript, Vue Router and Pinia.
- Migration: `navirox migrate` at `8792ca3`, where the only transform is
  `copy-movable-unit` and the run reports the imports it did not carry
  (`docs/evidence/migration-portable-units.md`, issue #13).
- Target: `examples/vue-pilot`, a scaffolded native app added in this change.

## Reproducible setup

```bash
node packages/create-navirox/dist/bin.js vue-pilot -d examples/vue-pilot
```

The scaffolder writes `link:` dependencies because it finds this checkout.
Because the pilot is a pnpm workspace member (`examples/*` is a member glob),
those five `@memolabs-apps/*` entries were set back to `workspace:*`, the
nested `pnpm-workspace.yaml` the template ships was deleted, and the workspace
member `metro.config.js` from `examples/vue-basic` was adopted so the renderer
resolves through the root virtual store. `pnpm install` at the root is clean.

```bash
node packages/cli/dist/bin.js migrate -C pilots/vue-web --out examples/vue-pilot
node packages/cli/dist/bin.js migrate -C pilots/vue-web --write --out examples/vue-pilot
```

The dry run and the write run print the same report:

```
Navirox migration
  performed: the files below were written.

Would move (1)
  src/stores/catalogue.ts
      to src/stores/catalogue.ts by copy-movable-unit

Unresolved imports (2)
  src/stores/catalogue.ts
      ../api/products: the file it names was not moved by this run
      ../lib/favourites: the file it names was not moved by this run

Not moved (6)
     4  no transform applies, and the plan called it native-replacement
     2  no transform applies, and the plan called it adaptable
```

`git diff --no-index pilots/vue-web/src/stores/catalogue.ts
examples/vue-pilot/src/stores/catalogue.ts` exits 0 with no output: the moved
file is byte identical to the source. The state record the run wrote
(`examples/vue-pilot/.navirox/migration.json`, not committed because it holds
the absolute output path) named the unit
`vue:src/stores/catalogue.ts:state-module:default` with fingerprint
`9018efe1eccf2e06` and transform `copy-movable-unit`.

Re-running the same command is idempotent, and this is the second run:

```
Would move (0)
  nothing

Unresolved imports (0)
  nothing

Not moved (7)
     4  no transform applies, and the plan called it native-replacement
     2  no transform applies, and the plan called it adaptable
     1  already migrated at this content
```

## What the run automated, and what it did not

Automated: the catalogue store moved byte for byte to the path the run chose,
and the run named the two files it did not carry. That is the whole of the
migration for this app. Everything a person had to write is below, with the
reason the run could not write it.

| File | Why the run did not write it |
| --- | --- |
| `src/api/products.ts` | The browser client fetched a Vite static asset through `import.meta.env.BASE_URL`. The plan called it `adaptable`. The port keeps the `Product` shape and the `async fetchProducts` contract the store awaits, and returns a bundled list. |
| `src/lib/favourites.ts` | The browser module read and wrote `window.localStorage`. The plan called it `adaptable`. The port keeps its interface (`ids`, `has`, `toggle`) and stores through the native secure store. |
| `src/views/HomeView.vue`, `src/views/FavouritesView.vue`, `src/views/ProductView.vue` | The plan called all four views `native-replacement`. They are written against the host primitives and `FlatList` from `@memolabs-apps/ui`. |
| `App.vue` | It carried the router and the layout. Rewritten as a view switch (see below). |
| `detox.config.js`, `e2e/journey.test.ts` | The template ships no e2e layer; the harness is ported from `examples/vue-basic`. |
| `android/app/src/androidTest/java/dev/navirox/vuepilot/DetoxTest.java`, the Detox lines in `android/app/build.gradle` and `android/build.gradle` | The template deliberately ships no Detox wiring, so Detox drove the legacy `android.test` runner until it was ported (see the Android note). |
| `metro.config.js`, `package.json` | Workspace member setup: module resolution paths, the four `e2e:*` scripts, and the Detox and Jest devDependencies. |

Deleted: the template's demo `components/` and `stores/canary.ts`. The migrated
store is the only file under `src/stores/`, and it is never edited by hand.

The platform-specific step goes through the native API seam. The web favourites
module is replaced by a module that calls `useSecureStore()` from
`@memolabs-apps/native`, keeps the same three-member interface, loads the key
once through a shared promise, and writes back on every toggle. The journey
therefore exercises the native module surface rather than holding state in
memory.

## Capabilities with no native counterpart

- Routing. The runtime has no router in 0.1, so the pilot's three routes
  (`/`, `/favourites`, `/product/:id`) become one view switch in `App.vue` with
  a `selected` product id. The difference is recorded, not hidden.
- Browser storage. `localStorage` has no direct native counterpart; the closest
  surface is the secure store, and the adaptation above is hand work.
- A static asset read through the dev server. The native app bundles the data.

## The journey

One spec, `examples/vue-pilot/e2e/journey.test.ts`, drives four tests with the
same launch and settle technique as the canary (synchronization is disabled
after launch and re-disabled while the first bundle arrives; containers assert
existence and leaves assert visible, because iOS never settles the visibility
of a view with no drawn surface):

1. renders the product list from the migrated store;
2. favourites a product and shows it in the header and the favourites view;
3. opens one product from the list and shows its detail;
4. keeps the favourite across a relaunch.

### iOS simulator

`corepack pnpm --filter vue-pilot e2e:build:ios` then
`corepack pnpm --filter vue-pilot e2e:test:ios`, iPhone 17, agent
`/tmp/pilot-ios-run2.log`:

```
PASS e2e/journey.test.ts (34.38 s)
    ✓ renders the product list from the migrated store (1176 ms)
    ✓ favourites a product and shows it in the header and the favourites view (1046 ms)
    ✓ opens one product from the list and shows its detail (1444 ms)
    ✓ keeps the favourite across a relaunch (6289 ms)
Tests:       4 passed, 4 total
```

### Android emulator

`corepack pnpm --filter vue-pilot e2e:build:android` then
`corepack pnpm --filter vue-pilot e2e:test:android`, AVD `atable_pixel`, agent
`/tmp/pilot-android-run4.log`:

```
PASS e2e/journey.test.ts (30.913 s)
    ✓ renders the product list from the migrated store (464 ms)
    ✓ favourites a product and shows it in the header and the favourites view (4936 ms)
    ✓ opens one product from the list and shows its detail (1331 ms)
    ✓ keeps the favourite across a relaunch (8598 ms)
Tests:       4 passed, 4 total
```

The relaunch test is the one that proves the secure store survived, and it
reads the header count and the favourite label again after the app restarts.

## The canary is untouched

No file under `examples/vue-basic` was changed. Both canary journeys were run
again, Metro killed first:

- iOS, iPhone 17: `PASS e2e/canary.test.ts (25.492 s)`, four of four, agent
  `/tmp/canary-ios-run.log`.
- Android, `atable_pixel`: build `BUILD SUCCESSFUL in 1m 20s`, then
  `PASS e2e/canary.test.ts (29.879 s)`, four of four, agent
  `/tmp/canary-android-run.log`.

One local environment fact belongs here so it is not mistaken for a canary
failure: rebuilding the canary for iOS on this machine fails at
`ScanDependencies` because the checked-in Pods state references an absolute
path from a previous checkout location, and a fresh `pod install` in
`examples/vue-basic/ios` fails with CocoaPods' known pnpm-repository
`path name contains null byte` error (cocoapods/cocoapods#12866). The journey
itself passes four of four against the existing binary, and CI builds the
canary for iOS from scratch on every push.

## The Android startup ANR, and what actually caused it

The first three Android runs failed before any test body ran, at
`device.launchApp`, with Detox unable to connect to the instrumentation. The
crash buffer was empty and there was no JavaScript error. An ANR trace pulled
from the device (`/tmp/anr-154848.txt`) showed the main thread burning about
12.7 seconds inside
`android.test.ClassPathPackageInfoSource.findClassesInApk` opening every dex
entry of the APK: the legacy `android.test.InstrumentationTestRunner` scanning
its classpath at startup.

The cause was the pilot's own missing wiring. The scaffolded app had no
`androidTest` source and no `testInstrumentationRunner`, so its androidTest
APK fell back to the legacy runner. Porting what the canary already has fixed
it: `DetoxTest.java` under
`android/app/src/androidTest/java/dev/navirox/vuepilot/`, the Detox lines and
`androidTestImplementation('com.wix:detox:+')` in `android/app/build.gradle`,
and the Detox AAR repository plus `rninfo.gradle` in `android/build.gradle`.
Without the last one the androidTest manifest does not merge, because the
public `com.wix:detox:+` resolution brings androidx.test activities without
`android:exported`.

Environment notes: the emulator ran with `-gpu host -memory 4096` (the AVD's
own config asks for 2 GB and no GPU), `svc power stayon true` and animation
scales at 0. The iOS run logs `open -a Simulator ... Unable to find application
named 'Simulator'` and drives the simulator headless anyway.

## Gaps this evidence does not close

- The pilot's journey is not wired into CI. It runs on this machine; the CI job
  belongs to the installable release (issue #15).
- A runtime router does not exist in 0.1, so the web pilot's three routes are
  one view switch here, and the migration report does not carry routes.
- The native API surface has no generic key/value storage module, so the
  browser capability was adapted to the secure store rather than mapped onto a
  counterpart.
- The scaffolder ships no e2e harness and no Detox wiring. Every scaffolded app
  needs the port described above, which is a template gap for issue #15.
- The migration report names imports by specifier; it does not resolve path
  aliases such as `@/`.
