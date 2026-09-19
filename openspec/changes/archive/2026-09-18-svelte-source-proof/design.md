## Context

Two adapters exist in the repository's hands and one exists in code. The Vue
adapter passed the shared contract check, and the pipeline that runs it imports
no framework. What no test can say yet is whether the model is neutral or merely
wide enough for Vue.

The constraints are the ones the seam was built with. The neutral packages must
keep passing the framework boundary check. The App Graph schema version must not
change, because a version bump would mean the first adapter had established
something the second cannot express. The acceptance app and the runtime path must
stay untouched, since they are the only end to end proof in the repository.

The one thing already known to be shared is the browser capability scan: it reads
text for browser APIs, which has nothing to do with a framework, and it currently
lives in the Vue adapter because that adapter was first. That is exactly the kind
of accident this change exists to find.

## Goals / Non-Goals

**Goals:**

- Move the genuinely neutral machinery into the neutral package, by the rule the
  seam declares: a concept enters the core when a second adapter needs it.
- Implement Svelte as a second, independent adapter with the same vocabulary of
  units, capabilities, dependencies and findings.
- Implement SvelteKit as a meta-framework that composes the Svelte adapter and
  reads the routing the framework documents.
- Prove comparability with a test that holds both reports to one shape.

**Non-Goals:**

- Svelte 4 syntax, runes migration analysis, `$state` and `$derived` semantics.
  The adapter targets the Svelte line this repository can actually test and
  reports anything outside its declared range.
- SvelteKit load functions, server routes, `$lib` resolution, and adapters.
  Those are reported as findings.
- Migration classification, planning and codemods, for the same reason as the
  previous change: no compatibility facts exist yet.
- A third adapter. Angular is deliberately after this gate, not beside it.

## Decisions

**The capability scan moves into `@memolabs-apps/source`.** It describes browser APIs,
both adapters need it, and its behaviour does not change in the move, which makes
the move reviewable as a relocation rather than a rewrite. Alternative rejected:
duplicating it in the Svelte adapter, which would have let the two adapters
disagree about the same file and would have proved the opposite of what this
change is for.

**The Svelte adapter gets its own unit discovery and no compiler dependency.**
Svelte's component format is a script block, markup and a style block in one
file, and the adapter detects the blocks it needs by reading them, since the
Svelte compiler is not a published parser with a stable block API the way Vue's
is. This is a narrower claim than the Vue adapter makes, and the difference is
recorded: the Vue adapter can reject a malformed component, the Svelte adapter
reports what it read. Alternative rejected: adding `svelte` as a dependency to
compile every component, which would drag a framework toolchain into a reading
step that does not need to execute anything.

**Routes come from SvelteKit's route files and from nowhere else.** A page is a
`+page.svelte` under the routes directory, and the path is the directory path,
which is the framework's documented contract rather than a convention a project
happens to follow. This is why SvelteKit can produce routes where the Vue adapter
refuses to: the evidence exists. Alternatives rejected: reading a router
configuration file, which would mean evaluating code, and inferring from a
`pages` directory in a plain Svelte project, which is the guess the Vue adapter
already refuses to make.

**The fixture projects live inside the adapter packages.** The migration plan
described two small example applications; a workspace example has to be
installable and would pull two frameworks into every install, while the
comparison only needs files on disk. The fixtures mirror each other component for
component so the comparison is a comparison of adapters rather than of projects.
Alternative rejected: adding `examples/inspect-vue` and `examples/inspect-svelte`
to the pnpm workspace, which would make every install pay for the gate.

**The comparison lives where the adapters are composed.** It needs both
adapters, so it cannot be neutral, and putting it in either adapter package would
make one depend on the other. The command line already composes the adapter set,
so the composition root is where the adapters meet. Alternative rejected: a new
package whose only purpose is the test, which is a package for a test.

**The gate is one test with a sharp assertion.** The comparison asserts the same
set of unit kinds and the same capabilities with the same usage kinds across both
reports, and that every node kind in either report is a kind the shared schema
defines. It is deliberately strict: a passing assertion that only checked both
reports exist would prove nothing.

Contract change questions, per AGENT-GUIDE section 12:

- Why the current arrangement is insufficient: neutral machinery was sitting in
  the first adapter, so a second adapter would have had to import the first
  adapter or copy it. Both outcomes would have hidden the seam.
- Which real adapter demonstrated the need: the Svelte adapter, in this change.
- Why adapter owned metadata is not enough: the capability names and usage kinds
  are shared vocabulary that both the report and a future planner reason about,
  so an adapter private copy would fragment the vocabulary.
- Whether the schema version changes: no. The App Graph stays at version 1, which
  is the strongest available statement that the model did not have to move for a
  second framework.

## Risks / Trade-offs

- **The Svelte adapter claims less than the Vue one.** It does not reject a
  malformed component, because it does not compile one. The support level and the
  findings say so, and the comparison is careful to compare vocabulary rather
  than depth.
- **A fixture comparison can be tuned until it passes.** The fixture journey is
  fixed before the adapters are written and mirrored component for component, so
  a divergence shows up as a missing kind rather than as an edited assertion.
- **Mixing Svelte 4 and 5 syntax is a real trap.** The adapter declares the range
  it is tested against and reports anything outside it, which is the same
  mechanism the Vue adapter uses for an untested major.
- **`+page.server.ts` and layouts are common enough that most real projects will
  produce findings.** That is the honest reading of an adapter with no server
  story, and the findings are the reason a user can see the limit rather than
  discover it later.

## Open Questions

- Whether the Svelte adapter should compile components once a stable parser
  entry point exists that does not require the full toolchain.
- Whether a third adapter should reuse the unit discovery shape or whether the
  duplicated walk between the two adapters is itself a sign that discovery
  belongs in the neutral package. This is deliberately left open until the third
  adapter: moving it now would be inventing a rule from two examples.
