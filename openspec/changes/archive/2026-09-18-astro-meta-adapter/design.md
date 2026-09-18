## Context

Seven adapters read seven frameworks, and all seven carry one assumption: the UI
of a project belongs to one framework. Astro is the first source that breaks that
assumption on purpose. An `.astro` file is a server rendered component with no
client runtime, and the interactive parts of it are islands, each written in a
framework of its own choosing. The Astro documentation is explicit that only
Astro components may contain components from several frameworks, which makes the
`.astro` file the composition point and not the framework component.

Three adapters already exist for the frameworks Astro hydrates most often: Vue,
React and Svelte. The MIGRATION-PLAN lists exactly those three as the prerequisites
for this phase, and all three are shipped.

Two measured facts shape the design. The first is that `src/pages` is a
documented routing contract of the framework, including the rule that a file or
directory prefixed with an underscore is excluded from the router. The second is
that `src/layouts` is not a contract: the Astro documentation says a layout is an
ordinary component, that "there is nothing special about a layout component", and
that the directory is a convention which is "not a requirement". That is the
opposite of Next, where `layout.tsx` is a file the framework reads.

## Goals / Non-Goals

**Goals:**

- Read an Astro project as one repository containing several UI frameworks.
- Derive routes from `src/pages` on the rules the framework documents.
- Identify islands, and hand each island's component to the adapter of its
  framework.
- Report the server surface rather than reading it as application code.
- Keep the App Graph at schema version 1, and keep every framework concept in
  adapter metadata.

**Non-Goals:**

- Server islands, actions, content collections, `astro:env`, session and cache
  APIs, and configuration redirects. These are recorded as not read rather than
  guessed at.
- Any transform, any migration written to disk, and any change to the runtime,
  the CLI surface beyond one registration, or the acceptance app.
- Reading a framework component that carries no hydration directive. It renders
  as static HTML, and this change does not claim to know whether it is a
  candidate for migration. That gap is recorded in the tasks, not filled by a
  guess.

## Decisions

**The adapter composes Vue, React and Svelte.** This is the fourth composition
in the codebase, after Nuxt over Vue, SvelteKit over Svelte and Next over React,
and it is the first one that composes more than a single base adapter. The
registry already prefers a candidate whose id another candidate declares in
`composes`, so Astro wins a project that declares Astro and Vue without the
registry learning a framework name. The alternative, reading island files with a
parser written for this adapter, was rejected because it would put framework
knowledge outside the adapter that owns it, which is the boundary rule the whole
source seam exists to hold.

**Delegation narrows the file list of the inspection context.** A delegated
adapter iterates `context.files.filter(isSourceFile)`, and reads the manifest
through `readText` independently of that list, so handing it a context whose
`files` contains only the files of its own framework delegates the reading
exactly. The alternative, adding a per-file entry point to the adapter contract,
was rejected because the contract is deliberately semantic rather than
parser-specific, and a second alternative, calling the delegated adapter once per
file, was rejected because it would turn a project reading into a pile of file
readings and lose the dependency and route reading the project needs.

**Astro files outside `src/pages` are components, not layouts.** Next reports
`layout` units because `layout.tsx` is a framework contract. Astro's own
documentation says a layout is a component and the directory is a convention, so
claiming a `layout` kind here would report a convention as a framework fact. The
consequence is deliberate and load bearing: the gate asserts that the Astro unit
kinds equal the Vue unit kinds, with no addition, where the Next gate asserted
Vue plus `layout`.

**Islands are adapter metadata, not a graph concept.** A hydration directive is a
framework construction, and the App Graph specification keeps framework
constructions in adapter metadata. An island is recorded on the unit of the file
that carries it, with the component name and the directive, and nothing about it
enters a shared type. This is the second question the graph answers the same way
after Next's module boundary, and the schema stays at version 1.

**Nodes are attributed to the adapter that produced the fragment, findings keep
their author.** Astro's fragment carries components that the Vue adapter read,
and their ids begin with `astro:`, because the fragment is the Astro adapter's
statement and the graph requirement is that an id names the adapter that produced
it. A finding is a claim rather than a reading, and re-keying a delegated
finding onto `astro:` would let two adapters produce the same id for the same
code and the same file, so a delegated finding keeps the id of the adapter that
made it. This asymmetry is new, it is the one thing in this change that no
previous adapter decided, and it is recorded in `docs/evidence/`.

**A framework the adapter cannot read is named, not guessed at.** When the
manifest declares an Astro integration for a framework that has no Navirox
adapter, the adapter reports a finding naming the integration and does not hand
those files to an adapter that would read them with the wrong rules. JSX is the
sharp case, because `.jsx` and `.tsx` are shared between React, Preact and Solid
and the Astro documentation asks for extra configuration to tell them apart.

**Two values of data are added to the neutral package.** `.astro` joins the
source extensions and `astro.config.mjs` joins the configuration names in
`@navirox/source`. Both are lists that a framework adds a value to rather than a
branch, which is the shape the file already documents.

Contract questions from the AGENT-GUIDE:

- Is the current contract insufficient? No. `composes`, `testedVersions` and the
  inspection context carry the whole reading, and no field was added.
- Which real adapter demonstrated the need? This one, for the first time, needed
  to *compose* several adapters rather than one, and it was expressible because
  `composes` is already a list.
- Why is adapter metadata not enough? It is enough for the islands, which is why
  no shared type grew.
- Does the schema version change? No. The App Graph stays at version 1, the third
  framework in a row that reads through it without moving it.

## Risks / Trade-offs

- **A delegated reading is a reading this adapter did not make.** The inspection
  merges units and capabilities that another adapter produced. The mitigation is
  the attribution rule above plus the gate, which reads an Astro fixture and
  compares its shape to the Vue fixture, so a delegation that silently dropped
  or duplicated readings would fail rather than pass.
- **JSX is ambiguous between JSX frameworks.** Only React is composed, so a file
  ending in `.jsx` or `.tsx` in a project that also installs Solid is read by the
  React adapter, which is the wrong ruleset. The mitigation is the finding that
  names the integration and the decision above to refuse the delegation in that
  case; the residual risk is a project that installs two JSX frameworks and
  configures nothing, which Astro itself cannot resolve either.
- **Conventions are attractive and wrong.** Treating `src/layouts` as a layout
  contract would have been easy and would have made the Astro report look more
  like the Next report. The trade-off is accepted in the other direction: the two
  reports differ where the two frameworks differ, and the gate states which
  difference is expected.
- **The fixture is smaller than a real site.** It cannot prove that every shape
  of Astro project is read. What it does prove is the reading, the composition,
  the attribution and the server surface, and the untested fixture proves the
  version rule.

## Open Questions

- Whether a framework component used with no hydration directive should be
  reported as a non-interactive UI candidate. Today it is neither an island nor
  a unit beyond the file it lives in, and the answer needs a migration decision
  to consume it before the graph admits anything.
- Whether an endpoint should eventually carry a classification, since an Astro
  endpoint and a Next API route are the same server shape reported by two
  adapters. The second occurrence is recorded; the shared concept waits for a
  third.
