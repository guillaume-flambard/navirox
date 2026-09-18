## Context

Change 1 shipped the seam and archived its specs. `@navirox/source` exports the
contract, the registry and the boundary check, and `@navirox/graph` exports the
model. `SourceInspection` is currently `{ descriptor, findings }`, which was
enough to typecheck an interface and not enough to write one against: an adapter
has nowhere to put what it discovered, and `buildGraph(inspection, ctx)` receives
that same empty payload.

The repository also has a second constraint. `@navirox/inspect` and the `inspect`
command are declared surfaces, while the CLI, the doctor and the real runtime
path work. The acceptance app must keep working untouched, because it is the only
end to end proof in the repository.

## Goals / Non-Goals

**Goals:**

- Extend the inspection payload so an adapter can return what it found, without
  changing any published requirement.
- Implement Vue as the first adapter: detection with evidence, components, store
  modules, browser capabilities, manifest dependencies, and the version range it
  was tested against.
- Implement the neutral inspection pipeline and a versioned report in both human
  and machine form.
- Add `navirox inspect` and compose the adapter set where the command is wired.

**Non-Goals:**

- Nuxt detection, route extraction from `vue-router`, layout and composable
  analysis. Those are the next stage and inventing them now would mean inventing
  facts.
- Migration classification, planning and codemods. `MigrationClass` has no
  producer yet, and `inspect` must not borrow the planner's job.
- Any change to the runtime packages, the acceptance app, or the CI workflows.
- A second adapter. Svelte is deliberately left for the change that proves the
  architecture, after this one proves the seam carries a real project.

## Decisions

**`SourceInspection` gains the discovered collections.** Descriptor and findings
were not enough: `buildGraph` takes the inspection as its input, so discovery has
to be in the payload or the graph step has to re-read every file. Re-reading would
duplicate the parse, double the IO and let the two reads disagree. Alternative
rejected: keep the payload thin and give the adapter a private field the graph
step reads, which turns a contract into a convention.

**The adapter uses Vue's own compiler.** `@vue/compiler-sfc` parses a single file
component into its blocks and reports a parse failure instead of silently missing
a match. It becomes the first runtime dependency this change adds, pinned at
`^3.5.43` to match the Vue line the repository already uses, recorded here for the
reason that the adapter must not hand parse its own framework. Alternative
rejected: a regex over the file text, which cannot tell a missing block from a
malformed component, and which the spec's own "a rejected file leaves the
inspection standing" scenario would then be unable to honour honestly.

**The adapter declares `experimental`.** It has no route extraction, no plugin
resolution and no migration transforms. The four declared levels exist for exactly
this, and claiming more would be the failure mode the positioning names.

**Route extent is not inferred.** A `views` directory is a convention, not a
route table, so no route node is produced and a finding says routes were not
extracted. Alternative rejected: mapping `src/views/**` to paths, which would
produce route nodes that no source line supports and that a later real router
inspection would have to retract.

**Capability use is detected by scanning script blocks against a declared pattern
set.** Each match carries `file:line` evidence and one of the declared usage kinds,
and a call whose direction cannot be determined is reported as unknown rather than
guessed. Alternative rejected: a full AST walk, which is heavier, still heuristic
for direction, and would tempt the adapter into modelling framework syntax the
graph is not allowed to name.

**The adapter set is composed at the composition root.** The CLI names adapter
packages as data and imports them lazily, the same way it already reaches
`@navirox/doctor`, and hands a populated registry to the pipeline. This is the
behaviour the archived spec already requires: a new adapter is registered at the
composition root without editing a generic package. Alternatives rejected: having
an adapter register itself through an import side effect, which hides the wiring
and makes ordering matter; and loading adapters named in a config file, which is
untestable indirection before there is a second adapter to justify it.

**The report is data, rendering is separate.** `InspectReport` is
`{ schemaVersion, source, summary, graph }`, and the human renderer takes it as
input. This is what lets a later `migrate` consume an inspection without a
terminal. The summary is counts, so no consumer has to walk the graph to answer
"how big is this".

**Findings are not failures.** The command exits successfully when an inspection
completed, including when findings of error severity were produced, because a
finding is data about the project. It fails only when no adapter could be chosen
or the contract itself was broken. Alternative rejected: exiting non-zero on error
severity findings, which conflates "this project has a problem" with "the tool
failed" and would break scripting on a project that merely has an unknown
dependency.

**No changeset.** `@navirox/inspect`, `@navirox/cli` and the new adapter all stay
at `0.0.0` and nothing in the repository is published. The repository still has no
changeset at all, and inventing the release process here would smuggle the
deferred release item into a source seam change.

Contract change questions, per AGENT-GUIDE section 12:

- Why the current contract is insufficient: an adapter could report a descriptor
  and findings and nothing else, so no implementation of the contract could carry
  a project. The gap was found by writing the first implementation, not in the
  abstract.
- Which real adapter demonstrated the need: the Vue adapter in this change.
- Why adapter owned metadata is not enough: the graph step reads the inspection
  payload, so a private adapter field would be read through a convention that
  TypeScript would not enforce.
- Whether the schema version changes: no. The versioned artifact is the App Graph
  and its `schemaVersion` stays `1`. The change is a TypeScript interface
  extension in an unpublished pre-alpha package.

## Risks / Trade-offs

- **Capability detection is textual and can miss a use.** It is a declared pattern
  set with recorded evidence, the report says what it looked for, and a miss is a
  false negative rather than a false claim. The support level states the limit.
- **`defineStore(` scanning can attribute a store to the wrong module.** Evidence
  names the file and line, and the spec forbids reporting a module that only
  imports the library, so the failure mode is a missing state module rather than a
  fabricated one.
- **A shallow report can read as authoritative.** The human renderer must state
  what was not inspected, and the adapter emits a finding for it, so the limit is
  in the output rather than in a caveat in the docs.
- **Extending `SourceInspection` before the second adapter exists** is the same
  trade-off change 1 accepted: the payload is shaped by one framework today. The
  mitigation is that every field is semantic and framework-neutral, so a second
  adapter either fills it or reports a finding against it.

## Open Questions

- Whether the summary belongs in the report or should be derived by its consumer,
  once a second consumer exists.
- Whether `SourceInspection` should carry routes at all, or whether route
  discovery belongs to the adapter's graph step, once a real router inspection
  exists.
