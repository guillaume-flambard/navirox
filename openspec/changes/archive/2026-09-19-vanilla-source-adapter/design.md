## Context

Eleven adapters answered the same kind of question: a project declares a framework, and
the adapter reads what that framework adds. Vanilla HTML/CSS/JS declares nothing, so the
question changes from "what does this framework add" to "what does the platform itself
hold that a migration can plan against".

Three facts decide the shape:

- The absence of a declaration is not evidence of a framework, and it is also not
  evidence of an application. Most packages in the world are libraries, and most of them
  contain no document.
- A document is addressable in a way no framework convention is: a static host serves
  `about.html` at `/about.html`, which is a property of serving files rather than a
  routing convention a framework documents.
- The framework has no component model, no store module and no router. Reporting any of
  those would be reporting the adapter's own assumption.

## Goals / Non-Goals

**Goals:**

- Claim a frameworkless web application and leave framework projects to their adapters.
- Read the documents as routes at the addresses they are served from.
- Read application modules as units and capabilities with the shared scanner.
- Report the two things that cannot be read: code inside a document, and routing decided
  at runtime.
- Keep the App Graph at version 1 with no shared type gaining a field.

**Non-Goals:**

- Reading a component model, a store or a router that the platform does not have.
- Inferring routes from link elements, history use or a dev server's rewrite rules.
- Reading styles, assets or the DOM structure of a document.
- Any transform, and any change to the runtime, the UI, the router or the acceptance
  application.

## Decisions

1. **A base adapter with no composition.** There is no framework to compose. Rejected: a
   `source-html` package that would exist only to be composed, since nothing composes it.
2. **Detection requires the absence of a known framework and the presence of a
   document.** The list of known frameworks is the one `@navirox/source` already declares
   to keep framework imports out of the core, so adding a framework remains a one-line
   data change in one place. Rejected: a second list inside the adapter, which would
   drift; and claiming on the document alone, which would let this adapter claim a Vue
   project that happens to ship an `index.html`.
3. **The candidate is declared at low confidence.** Any framework that matches a project
   offers a higher confidence, so selection prefers it, and this adapter is only ever
   reached when nothing else claimed the project. Rejected: a medium or high confidence,
   which would make selection depend on the order of the adapter list.
4. **Confidence is not the only guard.** A project that declares no framework and no
   document returns no candidate at all, which is the honest answer for a library.
5. **A document is a route at its own address.** `index.html` is `/` because that is what
   a host serves it as, and `about.html` is `/about.html`. The dev-server form
   `/about` is not reported, because claiming it would be inventing a rewrite the project
   never wrote down. Rejected: pretty paths, and reporting no routes at all.
6. **No unit kind is invented.** Application modules are `utility` units. The absence of
   components, layouts and stores is expressed by the report containing none of them,
   not by a finding repeated on every project. Rejected: treating a module that touches
   the DOM as a component.
7. **Inline script and runtime routing are findings.** A `script` element with a body is
   code living in a document, and `pushState`, `replaceState`, `popstate` and
   `location.hash` decide addresses the source does not contain. Both are reported.
   Rejected: reading the inline body as a module, and ignoring runtime routing.
8. **A document's script `src` is read, and the module it names is a unit.** This was going
   to be left out until measuring showed why it cannot be: the neutral predicate for an
   application module skips entry file names, so a vanilla project whose document loads
   `main.js` reported no unit for its own entry point and lost the capabilities inside it.
   The neutral rule is right for a framework project, where the entry is boilerplate the
   framework generates, and wrong for a document, which is the only place a frameworkless
   project says which code belongs to which page. The link is therefore read from the
   document, and the module carries `loadedBy` in its metadata. Rejected: a second
   application-module predicate inside the adapter, which would drift from the neutral one.
9. **There is no version to test against.** The declared range names the platform, `html`
   with `living standard`, so the adapter emits no untested-version finding. Rejected:
   inventing a version number for a living standard.
10. **No shared contract changes.** The four questions of the architecture guide: the
   contract is not insufficient, since a document-as-route fits `DiscoveredRoute` and a
   module unit fits `DiscoveredUnit`; a real adapter demonstrated the need, this one; an
   adapter metadata field would not help, because the document is already the source
   location; the schema version does not change.

## Risks / Trade-offs

- **This is the only adapter that can claim a project by absence**, so a wrong entry in
  the framework list either steals a framework's project or leaves a vanilla project
  unclaimed. The fixtures cover both directions, one project per outcome.
- **The kinds differ from Vue by two**, `component` and `state-module`, which is the
  largest difference any adapter has had to state. The gate asserts it by name rather
  than smoothing it over.
- **The capabilities differ from Vue by one**, `dom:unknown`, because a frameworkless
  application reaches for the document directly where a framework one does not. That is
  the finding a migration most needs to see, so it is named in the gate rather than
  filtered out.
- **HTML as a route is a serving fact.** A project with a dev server that rewrites
  `/about` is not modelled, and the route stays `/about.html`. The limitation is
  recorded rather than guessed around.
- **The link between a document and the module it loads is modelled**, because measuring
  showed the entry module would otherwise be missing from its own report. What is still
  not modelled is an anchor pointing at another document, which no decision consumes yet.

## Open Questions

- Should an anchor pointing at another document in the project become a graph edge? The
  graph has no edge kind for it today, and no decision consumes it yet.
- Should a framework declared only in `devDependencies` count as a declaration? Today it
  does, which means a project that lists a framework for tests is left to that adapter.
