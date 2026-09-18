## Context

Six adapters exist, the gate has held twice (Angular answered that the model did
not need to grow, React answered that the target's proximity did not leak), and
the migration engine now copies the units the plan calls shared. Next is the last
framework the roadmap lists before Astro, and it is also the case where the source
side and the target side share the most machinery.

Two facts shape the design. First, both of Next's routers are documented
filesystem contracts, so routes can be established from files that exist, the way
they are for SvelteKit and Nuxt and unlike plain React or Vue. Second, the App
Router makes the module boundary explicit through a directive, which is the first
time a framework hands us the browser and server split without us inferring it.

## Goals / Non-Goals

**Goals:**

- Read both routers, from their own conventions and from nowhere else.
- Report layouts as units, because a root layout is mandatory and is real code.
- Carry the module boundary without burying the report in per file findings.
- Refuse a project that is already native, rather than reading it as a source.
- Extend the gate with a Next comparison that is precise rather than relaxed.

**Non-Goals:**

- Server actions, streaming, suspense boundaries, route handler semantics and
  configuration options. Reported or ignored, never modelled.
- Reading the exported route manifest or evaluating any module. Routes come from
  files, as they do everywhere else.
- Any migration transform. This reads.
- Astro, which is a different composition question and the next change.

## Decisions

**The adapter composes the React adapter.** A Next project is a React project plus
conventions, so the component, store, capability and dependency reading is
delegated and only the additions are read here. This is the same composition as
Nuxt over Vue and SvelteKit over Svelte, now exercised a third time, which is what
makes it a pattern rather than a coincidence. Alternative rejected: a standalone
adapter, which would have duplicated the React reading and let the two drift.

**A native project produces no candidate.** React Native is what Navirox produces,
and a project that declares it is a target rather than a source. The refusal is the
absence of a candidate, because that is the only shape detection has, and the
reason travels on the inspection when the adapter is chosen by name so the user
learns why rather than seeing a silent nothing.

**Two routers, one route set.** Both routers are read, and the file that produced
a route is its source location, so a project mid migration between the two reports
both halves rather than one. Alternative rejected: reading only the App Router,
which would have silently under reported every project that has not migrated yet.

**The module boundary is metadata, not a finding.** Almost every interactive
component in an App Router project declares the client directive, so a finding per
file would produce a report where the boundary drowns everything else. It is
recorded on the unit, where it is available to a plan and to `--json`, and where it
costs a reader nothing. Alternative rejected: a finding per file, which is honest
in isolation and unreadable in aggregate.

**The gate comparison for Next is precise rather than strict.** The mirrored
fixture has a root layout because Next requires one, so the fixture cannot be a
twin of the Vue one. The gate therefore asserts what is actually comparable: the
same capability set as Vue, the same three unit kinds Vue has, and the layout unit
as the only addition, named. Alternative rejected: dropping the layout from the
fixture to make a strict shape assertion pass, which would have tested a project
that cannot exist.

Contract change questions, per AGENT-GUIDE section 12:

- Why the current arrangement is insufficient: nothing read Next, which is what
  most React teams actually run, and the module boundary had no representation.
- Which real adapter demonstrated the need: the Next adapter, in this change.
- Why adapter owned metadata is not enough for routes: routes are shared graph
  nodes and a plan and a report both reason about them; the boundary is not, and
  that asymmetry is exactly why one is a node and the other is metadata.
- Whether the schema version changes: no. The App Graph stays at version 1, which
  is now the third framework to leave it alone.

## Risks / Trade-offs

- **Two routers means two sets of conventions to keep true.** Each is small and
  documented, and the fixture covers both, including a route group.
- **The refusal rule could reject a project that merely mentions a native
  dependency.** It only looks at declared dependencies of the project root, so the
  failure mode is a project that has deliberately declared one, which is the case
  it is meant to catch.
- **Metadata is invisible in the human report.** It is available in `--json` and to
  the plan, and the human report names what it did not read rather than every fact
  it did.

## Open Questions

- Whether a client component should be classified differently from a server one
  once the plan can express it. The fact is recorded now so the decision can be
  made later without re reading the project.
- Whether the Pages Router reading should be dropped once Next stops supporting
  it, which is a data change in this adapter and not a model change.
