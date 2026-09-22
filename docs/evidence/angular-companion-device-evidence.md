# Angular companion device evidence

This is device evidence for the Angular proof companion. It reports a behavioural
result: the one declared workflow was driven on a device from the action sequence
the contract declares, and every declared capture exists. The journey has no
served web page, so there is no web counterpart and no comparison is reported.
This document makes no visual-fidelity claim and says nothing about the
benchmarked project's direction.

The machine-readable record is
[`angular-companion-device-evidence-ios.json`](angular-companion-device-evidence-ios.json).
The companion it drove is recorded in
[`angular-companion.provenance.json`](angular-companion.provenance.json), the seam
it consumes in
[`angular-neutral-seam-proof.md`](angular-neutral-seam-proof.md), and the workflow
in
[`workflow-suitecrm-record-workflow.md`](workflow-suitecrm-record-workflow.md).

## What produced the captures

| Field | Value |
| --- | --- |
| Command | `node scripts/capture-angular-companion.mjs --platform ios --keep` |
| Fixture | `packages/source-angular/fixtures/record-workflow`, read by the `angular` adapter as 5 files, 3 units and 1 capability with no finding |
| Screen | `packages/source-angular/companion/App.vue`, hand-written for this project |
| Copied shared module | `record-workflow.data.ts`, the planner's `shared` decision by `unit-shared-logic`, copied byte for byte |
| Device | `iPhone 17 Pro` (iOS simulator) |
| Benchmark revision | `2cd77380bc838b8bd6c80f9fbe25855d73ef860c` |
| Compiler | none: the Angular journey has no target compiler, so no compiler version and no manifest hash exist |

## The declared workflow

The companion implements the workflow the record contracts: open the queue,
select one record, edit one field, move its status, attach a document or a photo,
save the record. The device harness drove the identifiers the record declares
(`record-workflow-select`, `record-workflow-field`, `record-workflow-status`,
`record-workflow-attach`, `record-workflow-save`) and asserted the identifiers
every state renders (`record-workflow-screen`, `record-workflow-queue`,
`record-workflow-row`, `record-workflow-select`).

## Captures

| Moment | File | Bytes | sha256 |
| --- | --- | --- | --- |
| rest | `rest.ios.png` | 100627 | `0512c5ae370231a762b8d8063b1f5a669fb41ab63422790db7977cdd70e8fe76` |
| first meaningful | `first-meaningful.ios.png` | 129528 | `94be3fb56b23edbacaf4bcb90e15d31d3b6685aa06ce8a123cdb854abe559562` |
| midpoint | `midpoint.ios.png` | 131331 | `46800505fbf260ddb7cc706293ad9ebf0d42db32faed0a5c320b005bf9152e28` |
| settled | `settled.ios.png` | 135940 | `67c3e4d9c6cb267bf22770f4355a8e2785de2b95c7f462cf4fa7cfa465951e44` |
| interrupted | `interrupted.ios.png` | 131482 | `8ed30a6aebb063628f55583fc1a0c4d9241ce32b4677d2ade1fe5f21a5d11a9b` |

Every run starts a fresh instance from the fixed synthetic record set, so the
`rest` capture is the same starting state each time.

## The action sequence

| Moment | Actions |
| --- | --- |
| rest | none |
| first meaningful | select the first record |
| midpoint | select the first record, edit the field, move the status, attach |
| settled | the midpoint actions, then save |
| interrupted | select the first record, then the second one, replacing the pending selection |

## Android

The same command runs in continuous integration on the emulator
(`--platform android`), and the capture job uploads its capture directory and its
record `angular-companion-device-evidence-android.json`.

## Limits

- Template to native screen generation is not demonstrated: the companion's
  screen is hand-written work, named as manual in its provenance record.
- The journey has no served web page, so there is no web capture to compare with
  and no measured difference is reported.
- The pinned SuiteCRM benchmark's routing could not be read, so this proof claims
  no route, screen or unit the analysis did not establish.
- The pinned benchmark declares `@angular/core` 18.2.14, outside the tested `^20`
  and `^21` range, so the version stays untested.
- The workflow is an unvalidated hypothesis: no practitioner feedback exists.
- The simulator intermittently reports the application as busy until the
  harness's settle attempts are exhausted; the capture steps attempt twice before
  failing, and a real defect still fails both attempts.

## What this does not claim

No visual fidelity and no parity, and no measured visual fidelity for any
adapter. No generic Angular conversion and no Angular UI compiler. Nothing about
the benchmarked project's direction, and no affiliation: SuiteCRM has not
requested, reviewed or endorsed this work. Nothing about a real SuiteCRM
instance, its data or its credentials.

## How this is verified

```bash
node scripts/capture-angular-companion.mjs --platform ios --keep
pnpm --filter @memolabs-apps/visual-benchmark test
```
