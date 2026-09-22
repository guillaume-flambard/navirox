# Angular companion assembly

This is an assembly record for the Angular proof companion. The Angular journey
has no target compiler, so nothing here was generated from Angular templates. The
behaviour the companion shares comes from the module the planner approved, copied
unchanged, and the screen is hand-written work that the record names as such. It
makes no visual fidelity claim.

The machine readable form is
[`angular-companion.provenance.json`](angular-companion.provenance.json). The seam
proof it continues is
[`angular-neutral-seam-proof.md`](angular-neutral-seam-proof.md), and the workflow
it implements is
[`workflow-suitecrm-record-workflow.md`](workflow-suitecrm-record-workflow.md).

## What produced the companion

| Field                | Value                                                                    |
| -------------------- | ------------------------------------------------------------------------ |
| Command              | `node scripts/build-angular-companion.mjs --keep`                        |
| Fixture              | `packages/source-angular/fixtures/record-workflow`                       |
| Source adapter       | `angular`, 5 files, 3 units, 1 capability, 0 findings                     |
| Screen               | `packages/source-angular/companion/App.vue`, hand-written for this project |
| Provenance record    | `docs/evidence/angular-companion.provenance.json`                        |
| Compiler revision    | none: the journey has no target compiler                                 |
| Screen manifest hash | none: no compiler produced the screen                                    |
| Application          | `angular-companion-app`, scaffolded outside the checkout                  |

## The seam the companion consumes

The companion consumes one neutral output: the planner decision on
`angular:src/app/record-workflow.data.ts:utility:default`, classified `shared` by
`unit-shared-logic`, with the source evidence `src/app/record-workflow.data.ts`.
The assembly copies that module byte for byte into the application root and the
screen imports it, so the workflow's rules are the bytes the planner approved
rather than a second copy of them.

Angular imports stay in `source-angular`. The companion imports nothing from
Angular, and the adapter names nothing on the target side, which
`packages/source/src/boundary.test.ts` checks for every adapter package.

## What the planner approved

| Subject                                                               | Classification      | Rule                     |
| --------------------------------------------------------------------- | ------------------- | ------------------------ |
| `angular:src/app/record-workflow.data.ts:utility:default`              | `shared`            | `unit-shared-logic`      |
| `angular:src/app/record-workflow.component.ts:component:default`       | `native-replacement` | `unit-view-layer`        |
| `angular:src/app/record-workflow.component.ts:capability:file-reading:read` | `manual`      | `capability-no-counterpart` |

## Where every file came from

| File                     | Origin   | Why                                                                                                                                                                                                                                       |
| ------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `record-workflow.data.ts` | moved    | The planner classified it `shared` by `unit-shared-logic`, so its behaviour moves unchanged. Copied from `packages/source-angular/fixtures/record-workflow/src/app/record-workflow.data.ts`, content hash `12e2933bdf871127f0d625614fe8bd65ae8f43fb54d620588739f18ca9c6a94d`. |
| `App.vue`                 | manual   | The Angular journey has no target compiler, so the screen is hand-written work and is not generated from Angular templates.                                                                                                                |
| `index.js`                | manual   | The scaffolder template writes the runtime bootstrap and mounts the app root.                                                                                                                                                              |

No file is marked generated. A test re-reads the record and compares the moved
entry with the file it came from, so an edit to the copied module fails the suite:
the hash is the only check that notices.

## Manual native work

The planner named two pieces of manual work and neither is described as generated
from Angular templates or as generic Angular conversion. The component is a
`native-replacement` decided by `unit-view-layer`: the view layer is rewritten as
a native screen and what carries over is the behaviour behind it, not the markup.
The file-reading capability is `manual` decided by `capability-no-counterpart`: a
file input has no counterpart the rules can prove, so a person decides how the
native attachment step is implemented.

## The companion builds

| Platform | Bundle    | Identifiers |
| -------- | --------- | ----------- |
| iOS      | 6584 kB   | 12 of 12    |
| Android  | 6605 kB   | 12 of 12    |

The declared identifiers are `record-workflow-screen`, `record-workflow-queue`,
`record-workflow-row`, `record-workflow-select`, `record-workflow-detail`,
`record-workflow-field`, `record-workflow-status`, `record-workflow-attach`,
`record-workflow-attachment`, `record-workflow-save`, `record-workflow-saved` and
`record-workflow-error`.

## Limits

- Template to native screen generation is not demonstrated: no Angular template
  was emitted as a native screen and no Angular target compiler exists.
- The companion is not driven on a device by this change. That is the next
  backlog item.
- The SuiteCRM benchmark's routing could not be read, so this proof claims no
  route, screen or unit the analysis did not establish.
- The pinned benchmark declares `@angular/core` 18.2.14, outside the tested `^20`
  and `^21` range, so the version stays untested.
- The workflow itself is an unvalidated hypothesis recorded in
  [`workflow-suitecrm-record-workflow.md`](workflow-suitecrm-record-workflow.md),
  and Navirox has no affiliation with SuiteCRM.

## What this does not claim

No visual fidelity or parity, no generic Angular conversion, no Angular UI
compiler, and no claim about the benchmarked project's direction or any
relationship with it.

## How this is verified

```bash
node scripts/build-angular-companion.mjs --keep
pnpm --filter @memolabs-apps/source-angular test
pnpm --filter @memolabs-apps/visual-benchmark test
```

The assembly re-reads the fixture with the real adapter and planner and asserts
the three decisions before it builds anything, the source-angular tests cover the
moved rules, and the visual-benchmark tests compare the committed record with the
file it came from.
