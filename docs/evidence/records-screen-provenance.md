# Records screen source-to-generated provenance

How the Baserow-shaped web fixture becomes the native screen the fixture app
runs, and the checks that keep the chain honest. Companion to the machine
manifest at `packages/target-vue/fixtures/records/RecordsScreen.provenance.json`.

## Inputs

- Web fixture: `packages/target-vue/fixtures/records/RecordsScreen.web.vue`
- Compiler: `@memolabs-apps/target-vue` 0.1.1 (`compileVueTarget`)
- Manifest hash: `4e556ef30b20b25aa3d41209e26e4c4bf492cc2f750752760038704e0394002a`
- Findings: none. The fixture stays inside the supported subset on purpose;
  anything outside it must fail closed, which the target unit tests prove
  separately (RouterLink, transition, v-model, descendant selectors,
  unsupported CSS).

## Element mapping

| Web source | Generated native | Notes |
| --- | --- | --- |
| `main.screen` | `view.screen` | root, static `testID="records-screen"` |
| `h1.title` | `text.title` | heading becomes text |
| `p.message` with `v-if` / `v-else-if` / `v-else` | `text` / `view` with the same chain | loading, empty, error, ready states |
| `ul.record-list` | `view` with `testID="records-list"` | no virtualized list; the fixture is small |
| `li.row` with `v-for` + `:key` | `view` per row, static `testID="record-row"` | dynamic `` `record-row-${id}` `` has no native equivalent, the compiler emits the stable prefix |
| `button.row-button` with `@click` | `pressable` with `@press`, `testID="record-select"` | click becomes press |
| `section.detail` with `v-if` | `view` with `testID="record-detail"` | detail panel for the selected record |
| `data-testid` attribute | `testID` prop | renamed by the compiler; a verbatim `data-testid` would be an unknown prop the renderer ignores |
| class-only selectors, supported CSS props | unchanged | anything else is a finding, not output |

## Verification (task 2.2)

`scripts/verify-records-screen.mjs` packs the 31 candidate tarballs,
scaffolds a fresh app outside the checkout, recompiles the web fixture, and
refuses to continue unless the fresh output hashes exactly to the checked-in
`RecordsScreen.native.vue`. It then installs the app from the tarballs, lints
it with the generated screen as root, and Metro-bundles both platforms.

Run of 2026-09-21 (transcript: `records-verify-transcript.txt`):

- 31 artifacts packed, 81 scaffolded files
- manifest `4e556e...94002a`, compiler 0.1.1, zero findings
- `pnpm install` exit 0; app lint exit 0
- 5 Navirox packages resolve inside the app; react, react-native, vue,
  `@symbiote-native/vue`, `@symbiote-native/engine` one copy each
- iOS bundle 6,575,828 bytes; Android bundle 6,596,359 bytes
- 9/9 stable test identifiers present in both bundles:
  `records-screen`, `records-loading`, `records-empty`, `records-error`,
  `records-retry`, `records-list`, `record-row`, `record-select`,
  `record-detail`

What this does not claim: the bundles prove the screen compiles into the app
and exposes its identifiers, not that pixels match. Pixel comparison is
section 3 work. Device journeys stay blocked on the pre-existing Detox
`stream-json` runner failure documented in `release-candidate-0.1.1.md`.
