## Why

Eleven adapters detected a framework by the dependency a project declares. Vanilla
HTML/CSS/JS is the first source with nothing to declare, and that absence is the whole
architecture question this change answers: what can be read honestly from a web
application that has no framework at all, and what has to be reported as an absence
instead of invented.

There is also nothing to lean on. No component model, no store module, no router, no
file convention, no version to test against. What remains is what the platform itself
holds: documents the browser can be pointed at, and modules the documents load. A
migration plan for a vanilla application needs exactly that inventory, and a report
that quietly claimed components or routes the project never wrote would be worse than
no report.

The other risk is the mirror image of the one React named. Vanilla must not become the
adapter that claims everything: a project with no framework dependency and no HTML
document is a library, not a web application, and the adapter has to say so by claiming
nothing.

## What Changes

- A new package, `@navirox/source-vanilla`, a base adapter with no composition.
- Detection that claims a project only when the manifest declares no known source
  framework and the project contains an HTML document. The list of known frameworks is
  the one the neutral boundary already declares, so the list that keeps frameworks out
  of the core is also the list that decides what is not a framework project.
- The refusal of a project that declares a native dependency, imported from the React
  adapter rather than written a twelfth time.
- Documents are read as routes. An HTML file is the address a static host serves it
  from, which is a platform fact rather than a convention, so `index.html` is `/` and
  `about.html` is `/about.html`.
- Modules are read as units, capabilities come from the shared scanner, and the
  framework's absences (no component, no layout, no store, no router) are absences in
  the report rather than findings repeated on every project.
- Two forms of code the adapter cannot read are reported: an inline `script` block,
  which is code living in a document, and client-side routing calls
  (`pushState`, `replaceState`, `popstate`, `location.hash`), which decide addresses at
  runtime.
- A ninth pair of fixtures, registration at the composition root, a gate block, the
  README, and an evidence file.

## Capabilities

### New Capabilities

- `source-vanilla`

### Modified Capabilities

None. The App Graph stays at schema version 1, no type in `SourceInspection` gains a
field, and no neutral package is touched.

## Impact

- New package `packages/source-vanilla` (dependencies `@navirox/graph`,
  `@navirox/source` and `@navirox/source-react` for the inherited refusal).
- `packages/cli` gains one line in the composition root and one dependency, which takes
  the registry to twelve adapters, and `packages/cli/src/adapters.test.ts` gains a block.
- `tsconfig.json`, `tsconfig.json` references, `pnpm-lock.yaml`, the README and
  `docs/evidence/`.
- Nothing in the runtime, the UI, the router, the build, the acceptance application or
  any published surface. No dependency is added. No changeset, since nothing is
  published yet.
