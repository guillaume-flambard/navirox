## Why

The engine can move a unit, and on a real project it moves nothing. The pilot at
`pilots/vue-web` (`docs/evidence/pilot-web-inspection.md`) planned seven units and
classified none of them `shared`: its state module was `portable`, its API client
and its browser storage module were `adaptable`, and its four views were
`native-replacement`. The one transform only copies `shared` units, so the step
that is supposed to prove the machine produces no file at all.

The same reading found the second gap. A unit that does move can import files the
run does not move, and nothing says so. The graph carries no unit to unit import
edge, so a copy that leaves a dangling import behind looks clean.

## What Changes

- The copy transform moves the units the plan classified `shared` or `portable`
  byte for byte. `portable` is the class the planner gives a state module, and the
  copy still changes nothing about it.
- The run reports, for every unit it moves, each import the moved file names that
  this run did not carry. An import that resolves to another unit this run moved,
  or that names a dependency the project declares, is not reported.
- `navirox migrate` prints that list, so the manual work a copy leaves behind is
  visible without reading the source.

## Capabilities

### New Capabilities

- None

### Modified Capabilities

- `migration-engine`

## Impact

- `packages/migrate`: the transform predicate and identifier, an import reading
  helper, and one additive field on the run report.
- `packages/cli`: no code change; the `migrate` command prints the wider report.
- `docs/evidence/`: the pilot run is recorded next to the change.
- Not touched: the App Graph, the adapters, the planner, the compatibility
  registry, the runtime packages, the acceptance app.
- Out of scope: rewriting a moved file, resolving an aliased or bundled import,
  adding a unit to unit edge to the graph, and generating a native project.
