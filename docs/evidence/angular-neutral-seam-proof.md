# Angular neutral seam proof

This is the provenance record for the Angular proof path. It names each handoff
from the source input to the companion behaviour, the unit the companion
consumes, and every manual native replacement, so a reviewer can tell generated,
migrated and hand-written material apart.

It is a seam record, not a conversion result. It does not demonstrate that an
Angular template was emitted as a native screen, and no Angular target compiler
exists to do that.

The machine-readable form of this record is
`docs/evidence/angular-neutral-seam.provenance.json`.

## The chain

| Step | What happens | Evidence |
| --- | --- | --- |
| Source input | The original fixture is read, not installed or executed | `packages/source-angular/fixtures/record-workflow` |
| `source-angular` inspection | 5 files, 3 units and 1 capability, with no finding | `src/app/record-workflow.component.ts` is a component, `src/app/record-workflow.service.ts` is a state module |
| Neutral App Graph | The adapter's own metadata crosses the seam untouched | The unit node for `src/app/record-workflow.component.ts` carries `metadata.mobileReadiness` (`candidate`, `attachment-signal`) |
| Planner decision | The neutral plan classifies each subject and keeps its source evidence | `angular:src/app/record-workflow.data.ts:utility:default` is `shared` by `unit-shared-logic` |
| Companion behaviour | The companion consumes the permitted shared unit | The shared module declares the ordered actions, the identifiers they act on, the fixed record set and the save rule |

## The unit the companion consumes

The companion consumes one planner-approved shared unit:

| Field | Value |
| --- | --- |
| Subject | `angular:src/app/record-workflow.data.ts:utility:default` |
| Classification | `shared` |
| Rule | `unit-shared-logic` |
| Evidence | `src/app/record-workflow.data.ts` |

That module is the workflow's contract as data: the ordered actions and the test
identifiers they act on, the fixed synthetic record set, the desktop-only
remainder, and the `nextIn`, `canSave` and `saveOutcome` rules the workflow
screen calls. The planner approved it because it is logic with no platform
capability use, so it moves without changing its behaviour.

## Manual native work

Everything else in the workflow is manual, and this record says so.

| Subject | Classification | Rule | Why |
| --- | --- | --- | --- |
| `angular:src/app/record-workflow.component.ts:component:default` | `native-replacement` | `unit-view-layer` | The Angular view layer is rewritten as a native screen; the behaviour behind it carries over, not the markup |
| `angular:src/app/record-workflow.component.ts:capability:file-reading:read` | `manual` | `capability-no-counterpart` | A file input read has no counterpart the rules can prove, so a person decides how the native attachment step is implemented |

Neither is described as generated from Angular templates, and neither is
described as generic Angular conversion. The first is a hand-written native
screen; the second is a decision a person has to make.

## The seams

- **Source seam.** `source-angular` names Angular, which is where framework
  knowledge belongs, and it names nothing on the target side.
  `packages/source/src/boundary.test.ts` scans every `source-*` package's source
  for target-provider specifiers and fails on the commit that crosses the line,
  and it scans the neutral packages for framework specifiers.
- **Runtime seam.** Unchanged. The runtime provider and the target providers are
  untouched by this proof, and no provider type is re-exported by a public
  Navirox package.

## Limits

- Template to native screen generation is not demonstrated: no Angular template
  was emitted as a native screen and no Angular target compiler exists.
- The SuiteCRM benchmark's routing could not be read, so this proof claims no
  route, screen or unit the analysis did not establish.
- The pinned benchmark declares `@angular/core` 18.2.14, outside the tested `^20`
  and `^21` range, so the version stays untested.
- The workflow itself is an unvalidated hypothesis recorded in
  `docs/evidence/workflow-suitecrm-record-workflow.md`.

## How this is verified

```bash
pnpm --filter @memolabs-apps/source test
pnpm --filter @memolabs-apps/cli test
node packages/navirox/dist/bin.js plan -C packages/source-angular/fixtures/record-workflow --json
```

The CLI test drives the fixture through the real registry, the real inspection
and the real planner, and compares the plan it gets with this record, so the
record cannot drift away from the chain it describes.
