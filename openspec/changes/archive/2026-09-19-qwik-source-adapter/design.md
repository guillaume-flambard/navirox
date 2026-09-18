## Context

Nine adapters read nine frameworks, and the tenth is the first whose components
are not plain functions and whose state does not live in a module. Qwik is built
around resumability, so a component is a `component$` boundary and the state a
component reads is state the component created. That is a different shape from
every source read so far, and it is worth saying what it does and does not
change.

The docs decide the shape here, as for every adapter. Three facts from the
official documentation drive the design. First, `useStore` and `useSignal` are
hooks a component calls, and there is no documented store module an application
imports. Second, Qwik City documents the file system as the route table, and the
file system is richer than a directory tree: a `(name)` directory is pathless, a
page file may carry an `@name` layout suffix, and `layout.tsx` is the contract
that wraps pages. Third, the file system is not the whole truth, because
`vite.config.ts` can declare `rewriteRoutes` and `plugin.ts` files handle
requests before any layout runs.

## Goals / Non-Goals

**Goals:**

- Claim a Qwik project from its manifest, with the native refusal every JSX
  adapter inherits.
- Read the components a module declares and keep the reactive state it uses in
  adapter metadata rather than inventing a shared-state unit.
- Read the route table the file system documents, including pathless
  directories, parameters, rest segments, named layouts and Markdown pages.
- Report the surface that runs elsewhere or is not read, rather than reporting
  it as application code.
- Keep the App Graph at version 1 and add no shared concept.

**Non-Goals:**

- Modelling `useSignal`, `useStore`, `useTask$` or `useResource$` as graph
  concepts. They are framework constructs, and the graph keeps those in adapter
  metadata.
- Reading `routeLoader$`, `routeAction$` or `server$` bodies. They run on the
  server, which this adapter reports rather than reads.
- Reading Qwik Labs typed or declarative routes. They are a separate layer and
  are recorded as not read when a project uses them.
- Splitting Qwik City into its own adapter. The routing read lives here because
  the framework and its router ship together, as they do for Astro.
- Any transform, any change to the runtime or the acceptance app, and any new
  dependency.

## Decisions

**One adapter, not two.** Qwik City is the routing story of the same ecosystem
and the docs treat `src/routes` as the framework's route table, so the route
read lives in this adapter. Rejected: a separate `source-qwik-city` adapter,
which would duplicate the detection, the component read and the fixtures for a
split that no decision needs yet.

**Detection inherits the native refusal from the React adapter.** The mechanism
exists and Next, Astro and Solid already import it rather than rewriting it.
Rejected: moving it into the neutral package now, which is a shared contract
change this ticket does not need.

**Components are found by the boundary, and state usage is metadata.** A unit of
kind `component` is produced for a module declaring `component$`, and
`useStore` and `useSignal` are recorded on that unit. This is the honest reading
of the documentation: Qwik state is created by a component, so reporting a
`state-module` would be a claim the framework does not support. Rejected:
treating a file that calls `useStore` as a `state-module`, which would report
component-local state as shared.

**The route table is read from the conventions rather than from the directory
tree.** Pathless directories, `@name` suffixes and Markdown pages are all
documented, and each one changes the route when it is ignored. Rejected:
reading the tree and letting a wrong pattern stand, which is the failure mode
that matters most for a migration.

**Layouts are units of kind `layout`.** `layout.tsx` is a documented contract
that wraps pages, exactly like the root layout in Next, so it is a unit for the
same reason. Rejected: treating it as an ordinary component, which would lose
the fact that a page renders inside it.

**The route rewrite is a finding.** A `rewriteRoutes` declaration in the Vite
config changes paths outside the file system, and an adapter that read only
files would silently under-report. Rejected: ignoring it, and rejected: trying
to resolve the rewrite into concrete patterns, which would be a guess about
configuration this adapter does not interpret.

**No change to a shared contract.** The four contract questions: the current
contract is not insufficient, the demonstrated need is a real Qwik project,
adapter metadata is enough for the state usage, and the schema version does not
change.

## Risks / Trade-offs

- The component read is textual, so a component built by a factory this adapter
  does not recognise is missed. The mitigation is the same as for the other
  textual reads: a miss is a missing unit rather than a wrong one, and the
  detection evidence names the framework version so a reader can judge.
- Not reporting a `state-module` makes the Qwik report differ from the Vue
  report by one kind. That difference is named in the gate rather than smoothed
  over, because it is a fact about the framework and not a gap in the adapter.
- The gate compares a report that has an added kind and a removed kind, which is
  the widest difference any adapter has needed so far. It is asserted both ways
  so a silent change in either direction fails.
- Qwik Labs typed routes are not read and are not reported when present. This is
  a known hole rather than a guess, and it is recorded in the evidence file.

## Open Questions

- Whether a Qwik project that declares a context id in its own module deserves a
  unit, which would give the report a shared-state anchor. The answer should
  come from a migration decision that consumes it rather than from the shape of
  the framework.
- Whether Qwik Labs typed routes need their own read once a project in the wild
  uses them as the only route declaration.
