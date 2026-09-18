## Why

The plan decides and nothing moves. This is the change where Navirox first writes
into a project, and that changes what has to be true of the design: a tool that
decides badly is embarrassing, and a tool that writes badly is destructive. So the
first engine moves only the code that needs no rewriting, keeps a record of what
it did, refuses to do the same work twice, and can undo a step that failed.

It also closes the loop the previous changes opened. The plan classifies units as
`shared`, and the cheapest useful migration is the one that takes the units
nothing has to happen to and puts them where the native application can use them.

## What Changes

- Implement `@navirox/migrate`: a migration state file, a transform pipeline with
  declared families, and one generic transform that copies the units the plan
  called `shared` into a native workspace unchanged.
- Idempotence: a unit already migrated at the same source fingerprint is skipped,
  and a second run changes nothing.
- Safety: a dry run that writes nothing and is the default, an explicit flag to
  write, and a rollback that restores every file a failed transform touched.
- Add `navirox migrate`, which plans the transformation and, with the flag,
  performs it.

## Capabilities

### New Capabilities

- `migration-state`
- `migration-engine`

### Modified Capabilities

- None

## Impact

- `packages/migrate`: from a declared surface to an implementation.
- `packages/cli`: a fifth command and its arguments.
- `README.md`, `docs/evidence/`.
- Not touched: the adapters, the inspection pipeline, the planner, the runtime
  packages, the acceptance app, the CI workflows.
- Out of scope: source transforms that rewrite framework code, target transforms
  that generate screens, a native project scaffold, and any change to a file
  outside the output directory. The engine writes only where it is told to.
