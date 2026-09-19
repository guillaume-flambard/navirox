## Context

The migration engine was built to move the code that needs no rewriting, and its
first transform was written for units the plan classified `shared`. Inspection has
since learned to report application modules, and the pilot showed what that
produces on a real Vue application: the plan calls the store `portable` and the
logic modules `adaptable`, and `shared` never appears. A migration command that
moves nothing on the only real pilot is not yet a migration.

The engine already has the property this change needs. It iterates the graph's
units and runs every transform whose condition holds, so the selection lives in
the transform's predicate, not in the loop. Widening the predicate is a small
change to a machine that is already tested for selection, output paths, state,
idempotence and rollback.

## Goals / Non-Goals

**Goals:**

- Move the units the plan classified `portable` with the same byte for byte copy
  the `shared` units already get.
- Report, per moved unit, every import the moved file names that the run did not
  carry, with a reason a person can act on.
- Keep the engine framework neutral and keep the persisted state schema unchanged.

**Non-Goals:**

- Rewriting any moved file. The copy stays a copy.
- Resolving an alias such as `@/api/products` or a bundled path. The report names
  it as unresolved rather than guessing what it points at.
- Adding a unit to unit import edge to the App Graph. That is a new graph concept
  and the shared model stays minimal until a second consumer or a target decision
  needs it.
- Generating a native project, a scaffold, or a build configuration.

## Decisions

**The predicate becomes `shared` or `portable`, and the identifier is renamed.**
`copy-shared-unit` would be a lie once it copies a state module, so the transform
becomes `copy-movable-unit`. The two classes are the two the plan reserves for code
that moves without a rewrite, and renaming one stable identifier is not a package
reorganisation. Alternative rejected: teaching the planner to call a state module
`shared`, which would collapse a distinction the plan needs (a store is portable
because the runtime seam gives it a home, not because nothing has to happen to it).

**The report is additive and the persisted schema does not change.** The unresolved
list is a field of the run report, not of the state file, so `MigrationState` keeps
its version and an older record still parses. A reader that ignores the new field
sees the same report it saw before. Alternative rejected: versioning the report,
which would break a consumer for a purely additive read model.

**Import resolution is a neutral, conservative read, in the engine.** A relative
specifier is resolved against the moved file's directory using the source file
list the run can already probe through `readText`. A specifier that is not relative
is reported unless its package name is a dependency the project declares. Nothing
is rewritten on the strength of a resolution. Alternative rejected: putting the
import list on the unit as adapter metadata, which would need a new field on the
shared model and would make the report depend on a framework's parser for a fact
about files in a project.

**Only moved units are scanned.** The report answers "what did this run leave
behind", not "what is broken in the project". A unit the run did not touch is
already reported by the skipped list with its classification as the reason.

Contract change questions, per AGENT-GUIDE section 12:

- Why the current arrangement is insufficient: the only transform's condition
  matches no unit on a real project, so the migration writes nothing, and a moved
  unit can name an import the run did not carry with no signal at all.
- Which real consumer demonstrated the need: `pilots/vue-web`, whose inspection and
  plan are recorded in `docs/evidence/pilot-web-inspection.md`.
- Why adapter owned metadata is not enough: whether a moved file's imports were
  carried is a fact about the files in one project and one run, not about a
  framework, and stating it does not require knowing which adapter read the file.
- Whether the schema version changes: no. The migration state keeps schema version
  1, because only the run report gains a field and nothing persisted changes.

## Risks / Trade-offs

- **A moved store whose imports were not moved is not runnable by itself.** That is
  exactly what the report says, and the alternative is the same file with no
  warning at all. The pilot run records the two unresolved imports it produces.
- **The import read is textual and conservative.** It recognises the module forms a
  project actually uses and prefers to report an unresolved specifier over
  resolving one by guesswork. A specifier it cannot place is a manual step, not a
  silent success.
- **`portable` today means a state module.** The widening is bounded by the
  planner: only a state module is classified `portable` as a unit, because a logic
  unit that uses a capability becomes `adaptable`. A future rule that widens
  `portable` widens this transform too, which is the intended coupling.
- **The fingerprint still covers the unit's own file.** A moved unit that imports a
  changed neighbour is not treated as changed, which the engine design already
  states as a limit; the unresolved report now makes the neighbour visible.

## Open Questions

- Whether a later change should add a unit to unit import edge to the graph so the
  report can use the graph rather than a scan. It waits for a second consumer.
- Whether a moved unit's unresolved imports should block a write rather than be
  reported. Reporting first keeps the user in control.
