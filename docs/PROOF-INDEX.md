# Proof index

This index is the one place where an outside evaluator can see both proofs side
by side. It cites the evidence; it does not copy it. Every row names the command
that produced the evidence, the immutable input that command used, the artifact
it wrote, the limitation the evidence records and the release status of the
claim.

The status vocabulary is the one `docs/READINESS-MATRIX.md` already uses:
`supported`, `simulated`, `deferred` and `excluded`. A status here describes the
proof, never the product. Nothing in this index claims a supported product
capability, a real-instance integration, production readiness or visual parity,
and the condition-by-condition breakdown stays in the readiness matrix.

## The journeys

| Journey                                | Command                                                                            | Immutable input                                                                                                         | Artifact                                                                                                         | Limitation                                                                                                                                                                                       | Status    |
| -------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| Vue: field record update               | `node packages/visual-benchmark/scripts/capture-records-native.mjs --platform ios` | `baserow/baserow@81e094a1f4b3a62625c218d78fe319ba44098617` (web-frontend, nuxt adapter) with the field-workflow fixture | `docs/evidence/native-capture-field-workflow-ios.json`, `docs/evidence/vue-companion-device-evidence.md`         | The capture drives a local fixture, not a Baserow instance: authentication against a real instance, offline synchronization and data residency are deferred or excluded in the readiness matrix. | simulated |
| Angular: record update with attachment | `node scripts/capture-angular-companion.mjs --platform ios`                        | `salesagility/SuiteCRM-Core@2cd77380bc838b8bd6c80f9fbe25855d73ef860c` with the record-workflow fixture                  | `docs/evidence/angular-companion-device-evidence-ios.json`, `docs/evidence/angular-companion-device-evidence.md` | The fixture stands in for the service and the attachment path is a device-storage stand-in, so the row is simulated and not a claim about a real SuiteCRM instance.                              | simulated |

## The benchmarks

| Benchmark | Repository and pin                                                                           | Adapter | What is measured                                                                   | Artifact                                                                                            | Status    |
| --------- | -------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------- |
| baserow   | `https://github.com/baserow/baserow.git@81e094a1f4b3a62625c218d78fe319ba44098617`            | nuxt    | 46 routes and 41 screens minimum, plus a target diagnostic limited to 12 documents | `docs/evidence/workflow-baserow-field-work.md`, `docs/evidence/vue-target-baserow-diagnostic.json`  | supported |
| cal-com   | `https://github.com/calcom/cal.com.git@54343aa685ae8f33159d2f485ec4a57bad5c574a`             | next    | 81 routes and 80 screens minimum, against the `calcom/companion` mobile reference  | `benchmarks/catalog.json`, `docs/benchmarks.md`                                                     | deferred  |
| suitecrm  | `https://github.com/salesagility/SuiteCRM-Core.git@2cd77380bc838b8bd6c80f9fbe25855d73ef860c` | angular | 1588 portable units minimum                                                        | `docs/evidence/workflow-suitecrm-record-workflow.md`, `docs/evidence/angular-suitecrm-benchmark.md` | supported |

The cal-com row is deferred because the pin and the thresholds are declared and
the analyzer runs against them, but no separate retained report is published for
that project yet. The two supported rows cite the report each run wrote.

## What may be installed today

Public package installation is incomplete, and this index states it rather than
implying a supported install path. `docs/evidence/release-candidate-2026-09-19.md`
records the registry state and the verification behind it.

| Path                                      | Installs | Builds | Runs | Why                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------- | -------- | ------ | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Published registry (`npm create navirox`) | no       | no     | no   | `create-navirox` resolves at 0.1.0, but outside this repository the packages it points at are written as `0.0.0`, so `pnpm install` does not resolve them, and `@memolabs-apps/cli`, `@memolabs-apps/source-lit` and `@memolabs-apps/source-solid` are not on the public registry, so `npx navirox` does not resolve either. |
| Packed tarballs (`pnpm test:e2e`)         | yes      | yes    | yes  | `scripts/e2e-scaffold.mjs` packs the publishable packages, scaffolds an app outside the workspace, installs from the tarballs, checks that every runtime package resolves to exactly one copy and builds both platforms. CI runs it on every push.                                                                           |

Until the publication tracked in issue #17 lands, the tarball path is the only
verified way to install and run an app, and `docs/GETTING-STARTED.md` says so in
its first step.

## How this is checked

`node scripts/check-proof-index.mjs` reads this document and the declared rows in
`scripts/lib/proof-index.mjs` and fails when a row cites an artifact that does
not exist, when a benchmark project in `benchmarks/catalog.json` has no row, or
when a status word is outside the declared vocabulary. `packages/visual-benchmark/src/proof-index.test.ts`
proves those three failures on seeded inputs and proves this index is clean.
