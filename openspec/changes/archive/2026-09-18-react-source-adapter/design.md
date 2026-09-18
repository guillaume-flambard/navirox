## Context

Five adapters read five frameworks, and the gate holds two of them to one shape.
The one framework conspicuously absent is the one whose language the repository's
own identifiers are written in: React, and React Native behind it.

That absence is a risk rather than an omission. The architecture says a source
framework reaches Navirox only through a source adapter and the renderer only
through the runtime seam, and the sharpest test of that statement is an adapter for
a framework the target also uses.

## Goals / Non-Goals

**Goals:**

- Detection, components, state modules, routes, capabilities and findings for a web
  React application, in the shared vocabulary.
- A detection rule that refuses a native project, so the target cannot be read as a
  source.
- A mirrored fixture and an extended gate, to say whether the model held.

**Non-Goals:**

- Next.js, Remix and the React Router data APIs. Each is a meta-framework with its
  own conventions, the way Nuxt was for Vue.
- Class components, higher order components, render props, server components and
  concurrent features. A class component is a finding.
- Parsing JSX to find capability use beyond what the shared scan sees in the file.
- Any migration transform.

## Decisions

**Detection refuses a project that declares the native runtime.** A React Native
application is what Navirox produces, not what it reads, and an adapter that
accepted one would invite exactly the confusion the architecture forbids: the
target's shape deciding what the source is. The refusal is a candidate list with no
entry plus a reason, not an error. Alternative rejected: detecting both and relying
on the user to choose, which would have made the confusion available by default.

**A component is found by what a module exports.** A function that returns an
element is a component; a class that extends the framework's component is a
component and is also a finding, because this adapter reads the function era. A
file named `Button.tsx` that exports a constant is not a component. Alternative
rejected: extension and name based discovery, which is what most tooling does and
which reports files the framework itself would not render.

**State is found by declaration, as it was for Angular and Svelte.** React has no
store of its own, so a state module is a module that declares one through a state
library, and everything else is a utility. A module that only imports the library
is not a store, which keeps the state module count meaningful. Alternative
rejected: treating a module of custom hooks as a state module, which would have
made the kind mean "hooks live here" rather than "state lives here".

**Routes come from the router configuration, top level only.** A `path` literal is
a fact; children and lazy components are configuration to be evaluated. This is the
same reading the Angular adapter performs on its own routes file, which is a sign
that the rule belongs to the neutral layer rather than to two adapters; it is left
in each adapter for now because the neutral move would be a rule invented from two
examples, and the third is the moment to move it. Alternative rejected: moving it
now, which would have repeated the mistake the mapper avoided.

**A native dependency is a finding.** A web project that declares the native
runtime or a native module is reaching the target, which is a migration question
and not a plain reading. Naming it in the report is the honest result and it is the
one case where the proximity the architecture warns about becomes visible to a
user. Alternative rejected: ignoring it, which would let a report imply the project
is an ordinary web application.

Contract change questions, per AGENT-GUIDE section 12:

- Why the current arrangement is insufficient: the most common source framework had
  no adapter, so detection returned nothing for it.
- Which real consumer demonstrated the need: a React web project, and the gate that
  compares it against Vue.
- Why adapter owned metadata is not enough: whether a project is a web source or a
  native target is the first question every consumer asks, and it has to be answered
  the same way everywhere.
- Whether the schema version changes: no, and a change would mean the model had been
  Vue shaped after all.

## Risks / Trade-offs

- **Reading JSX without parsing it.** Component and capability discovery are textual
  over comment-stripped source, which the Svelte and Angular adapters already do for
  the same reason. A missed component is a missing unit rather than a wrong one.
- **The native runtime refusal could hide a real project.** A web project that
  happens to depend on the native runtime, for a shared module, would be refused.
  The reason names the dependency, so the answer is legible rather than mysterious.
- **The route reading duplicates the Angular one.** Two copies of the same rule is
  the point at which the previous changes moved a helper into the neutral core, and
  leaving it duplicated here is a deliberate exception: the next adapter that needs
  it should move it, and until then the duplication is the evidence.
- **A fixture comparison can be tuned.** The fixture mirrors the journey the other
  fixtures tell, and the gate compares kinds and capabilities rather than counts.

## Open Questions

- Whether the route reading should move into the neutral core at the third adapter,
  which would be Astro rather than Next.
- Whether a class component should be `native-replacement` with a finding, or a
  finding alone, once a real project shows how much of one exists.
