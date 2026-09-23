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
| Screen | `packages/source-angular/companion/App.vue`, emitted by `@memolabs-apps/target-angular` |
| Copied shared module | `record-workflow.data.ts`, the planner's `shared` decision by `unit-shared-logic`, copied byte for byte |
| Device | `iPhone 17e` (iOS simulator, UDID `35B5C999-E00F-4AE9-996D-35BFBA7D4740`) |
| Benchmark revision | `2cd77380bc838b8bd6c80f9fbe25855d73ef860c` |
| Compiler | `@memolabs-apps/target-angular` `0.1.1`, screen manifest hash `8daa34f20f6062337fd7022bec4a0415631c171fc039cc60158ffe5e3a741513` |

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
| rest | `rest.ios.png` | 79680 | `0baf4f569929fb4ddb45f6b076e4834995a930a1b21ab39e68c7825cd1b817b7` |
| first meaningful | `first-meaningful.ios.png` | 103922 | `4689430a7fb392be9e5fa94dda9b4fe863f8a5bd8e99520f8f859cde779ee2eb` |
| midpoint | `midpoint.ios.png` | 178358 | `1f34ccb32717e2ef5d56e89fda1d174dd2ba988ba3b0fba75f67877de81fc14a` |
| settled | `settled.ios.png` | 182409 | `36efb9c92107a3c76f8d5055a1b493eee9856b0be6a50ac7765c7825908fb51d` |
| interrupted | `interrupted.ios.png` | 105210 | `db2859031ff5ae53362c617ad5a56d63afa7ed66fcdde9b47a1ff758a194ae80` |

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

The same command runs on the emulator (`--platform android`), and it passes: five
captures and an empty missing list, recorded in
[`angular-companion-device-evidence-android.json`](angular-companion-device-evidence-android.json).

## Limits

- The generated screen is proven on one bounded workflow only: the compiler
  accepts a closed set of Angular constructs and refuses the rest with a finding,
  so this is not generic Angular conversion.
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
adapter. No generic Angular conversion and no general Angular UI compiler. Nothing about
the benchmarked project's direction, and no affiliation: SuiteCRM has not
requested, reviewed or endorsed this work. Nothing about a real SuiteCRM
instance, its data or its credentials.

## How this is verified

```bash
node scripts/capture-angular-companion.mjs --platform ios --keep
pnpm --filter @memolabs-apps/visual-benchmark test
```
