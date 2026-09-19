## Why

The canary at `examples/vue-basic` proves that the runtime renders a Vue component
as native views, but it is not a migration: it was written as a native application
from the start. The pilot at `pilots/vue-web` is a real Vue application, and
`docs/evidence/migration-portable-units.md` records that `navirox migrate` moves
exactly one unit of it, the catalogue store. Nothing yet shows that the moved file
runs. The pilot's journey has never been exercised on a device, and the two imports
the run did not carry are a line in a report rather than work someone did.

## What Changes

- A new native application, `examples/vue-pilot`, is produced by running the shipped
  CLI over the pilot. The store it contains is the file the migration wrote, byte
  for byte, and the application imports it at the path the run chose.
- The work the run leaves behind is written by hand and recorded: the native views,
  the API client that read a static asset, and the favourites module that read
  `window.localStorage`.
- The favourites module is adapted to the secure store from `@memolabs-apps/native`,
  so the journey's platform specific step goes through the native API seam rather
  than being dropped.
- One Detox spec runs the pilot's journey on the iOS simulator and the Android
  emulator: the product list, favouriting a product, the count in the header, the
  favourites view, one product detail, and the favourite surviving a relaunch.
- The existing canary journey is re-run unchanged, so the proof is additive.

## Capabilities

### New Capabilities

- `migrated-journey`

### Modified Capabilities

- None

## Impact

- `examples/vue-pilot`: a new native application and a pnpm workspace member.
- `docs/evidence/`: the source, migration and target revisions, the files the run
  wrote, every file written or edited by hand, the journey result per platform, and
  the known gaps.
- Not touched: `packages/*`, the migration engine, the planner, the adapters, the
  compatibility registry, the App Graph, and `examples/vue-basic`.
- Out of scope: a runtime router (it lands with 0.2, so the pilot's three routes
  become one view switch and the difference is recorded), a generic key/value
  storage module on the native API surface, and CI job wiring for the pilot, which
  belongs to the installable release.
