## Context

Three adapters exist and the gate that put two frameworks through one pipeline
passed: the graph schema did not move, and the capability vocabulary was shared.
Nuxt is the next request the product strategy makes, and it is a different shape
of work from the Svelte proof. Svelte proved the seam; Nuxt is what the seam is
for, because the repositioning's execution wedge is Vue and Nuxt and a Nuxt team
needs a readiness reading before it needs anything else.

Nuxt also arrives with a property no previous adapter had: it is Vue plus
conventions, so most of what it needs is already read. The question this change
answers is whether composition works as well as it was declared to.

## Goals / Non-Goals

**Goals:**

- Read what Nuxt adds: filesystem routes, layouts, composables, and the server
  and plugin surface as findings.
- Keep the capability vocabulary shared, including for the framework's own data
  fetching, so a Nuxt report is comparable to any other report.
- Register the adapter with one line at the composition root.

**Non-Goals:**

- Nuxt 2, whose conventions and syntax differ enough to be a separate adapter.
- Nitro server internals, `useAsyncData` payload semantics, module options, and
  auto import resolution. Reporting them is the honest outcome; modelling them
  would be a second product.
- Any migration transform.
- Changing the cross-adapter gate. Its two fixtures stay mirror images of each
  other; the Nuxt fixture is a Nuxt project, not a third twin.

## Decisions

**The adapter composes the Vue adapter and reads only what Nuxt adds.** Detection
reads the manifest, routes come from the pages directory, layouts and composables
become units, and the component reading is delegated. This is the composition the
`composes` field was declared for, and it is now exercised by a second adapter,
which is what turns it from a declared capability into a working one. Alternative
rejected: reimplementing the component reading, which would have been a second
answer to a question the Vue adapter already answers.

**The Nuxt data helpers are a network request, not a new capability.** The neutral
pattern set gains the framework spellings of a request, so `useFetch`,
`useAsyncData` and the global `$fetch` are reported as `network-request` with the
`invoke` usage. The capability model describes what an application does to the
platform, not how a framework spells it, and inventing a Nuxt capability name
would have made two projects with the same behaviour incomparable. Alternative
rejected: a `nuxt-data-fetching` capability, which is a framework shaped hole in
a neutral vocabulary.

**Layouts and composables are units rather than findings.** They are real
application code with a source location, and the graph already has the kinds for
them (`layout`, `utility`). Reporting them as findings would have said the
adapter could not read them, which is false. Alternative rejected: treating the
composables directory as an unmodelled convention, which would have hidden the
largest body of portable code in a typical Nuxt project.

**The server and plugin surface is reported, never modelled.** A server route, a
plugin, a middleware and a runtime configuration file each get a finding naming
the file. Nuxt's server side is a different runtime and the adapter has no reading
of it, so the report says so. This is also the first time a finding tells a user
something they need for the migration rather than something the adapter could not
parse, which is the shape the PRD's browser and server boundary question has.

**No new graph concept.** Routes, layouts, utilities, capabilities and findings
are all existing node kinds. A Nuxt project that produced a new kind would be
evidence that the model was Vue shaped after all, and the gate's claim would have
to be revisited.

Contract change questions, per AGENT-GUIDE section 12:

- Why the current arrangement is insufficient: the capability pattern set did not
  recognise the framework's own data helpers, so a Nuxt project's network use
  would have been invisible while a plain one's was reported.
- Which real adapter demonstrated the need: the Nuxt adapter, in this change.
- Why adapter owned metadata is not enough: the capability name and usage kind are
  shared vocabulary the report and a future planner reason about, and an adapter
  private spelling would fragment it.
- Whether the schema version changes: no. The App Graph stays at version 1 and no
  new node kind is introduced.

## Risks / Trade-offs

- **A page convention can be read as a route when a project overrides routing.**
  Nuxt's routing is configuration that can be replaced; the adapter reads the
  documented convention and does not read configuration files. The limit is
  stated in the adapter's documentation and the route set is what the files say.
- **Composables become units, which raises the unit count substantially.** That is
  the point: those units are the portable code the report exists to surface.
- **Findings for server files will be numerous on a real project.** Each one names
  a file the adapter did not read, which is the honest count of what is out of
  scope, and the severity is info rather than a warning.

## Open Questions

- Whether the route rules should be read from the Nuxt configuration once a real
  project shows a routing override in the wild. Deferred until there is one.
- Whether the server surface should eventually become a capability model rather
  than a finding, which would need the target side to have an opinion about
  server work.
