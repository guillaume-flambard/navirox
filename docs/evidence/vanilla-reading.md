# Vanilla: the adapter that is claimed by absence

## The question, and the answer

Every adapter before this one detected a framework by the dependency a project declares.
Vanilla HTML/CSS/JS declares nothing, so the question changed shape: what can be read
honestly from a web application that has no framework, and what has to be reported as an
absence rather than invented.

Nothing shared moved. The App Graph stays at schema version 1, no type in
`SourceInspection` gained a field, no neutral package was touched, and no dependency was
added. The twelfth adapter is the narrowest of the twelve, and it says so in its own
evidence file.

## What decides the shape

Three facts, each from the platform rather than from a framework's documentation:

1. **A document is addressable by the host, not by a convention.** A static server
   answers `about.html` at `/about.html`. There is no framework here to say what a path
   means; there is a file, and there is the address it is served from.
2. **There is no component model, no store module and no router.** A vanilla project has
   DOM APIs and modules. Reporting a component, a layout or a state module would be
   reporting the adapter's own assumption, so the report contains none of them.
3. **A document runs a module, and the project's own entry files are exactly what the
   neutral application-module predicate skips.** This was the fact that changed the plan.

## The measurement that changed the plan

The neutral predicate for an application module excludes entry file names, `index` and
`main`, because in a framework project the entry is boilerplate the framework generates.
In a vanilla project it is the opposite: `src/main.js` is where the application is, and
the document is the only place that says which module belongs to which page.

The first inspection of the mirror fixture therefore reported five units and three
capabilities, with `src/main.js` missing entirely even though `index.html` loads it on
every visit. The link is now read from the document: a script `src` that resolves to a
file the project contains makes that file a unit, whatever the neutral predicate would
have said, and the unit carries `loadedBy` in its metadata. The neutral rule was not
changed, because it is right for the eleven framework adapters; the document seam added
the fact the platform holds.

## What the adapter reads now

| Read                          | Shape                                                       | Where it lands  |
| ----------------------------- | ----------------------------------------------------------- | --------------- |
| A document                    | `.html`, served at its own address, `index.html` naming its directory | routes |
| The module a document runs    | a script `src` resolving to a project file                   | unit metadata   |
| Application modules           | every module, including entry files a document loads         | units (`utility`) |
| Runtime capabilities          | the shared scanner over source with comments stripped        | capabilities    |
| Production dependencies       | the manifest                                                 | dependencies    |
| A script with its own body    | code living in a document                                    | finding         |
| Routing decided at runtime    | `pushState`, `replaceState`, `popstate`, `location.hash`     | finding         |

On the mirror fixture: 6 units (all `utility`), 3 routes (`/`, `/about.html`,
`/pages/team.html`), 6 capabilities (the Vue five plus `dom:unknown`), 2 findings
(`vanilla-inline-script`, `vanilla-client-routing`), and no dependencies because the
fixture's manifest declares only a build tool.

## Why there is no version to test against

Every other adapter declares a semver range and reports a major outside it. There is no
version of HTML. The declared range names the platform, `html` with `living standard`, so
the adapter emits no untested-version finding at all. Inventing a version number would
have been the one dishonest line in the report.

## Why the two differences from Vue are both named

The gate compares this report to the Vue one, and both differences are asserted in both
directions rather than smoothed over:

- **Kinds**: the Vue kinds minus `component` and `state-module`, which is the largest
  difference any adapter has had to state, because the platform has neither.
- **Capabilities**: the Vue multiset plus `dom:unknown`, because a frameworkless
  application reaches for `document` and `window` directly where a framework one does not.
  That is not noise; it is the difference a migration most needs to see, since every such
  call is a place where the app owns the DOM a native screen cannot.

## What was deliberately not done

- No pretty paths. A dev server that rewrites `/about` onto `about.html` is a project's
  configuration and not a fact this adapter can see, so the route keeps `/about.html`.
- No reading of an anchor to another document as a graph edge. No decision consumes that
  today, and the graph has no edge kind for it.
- No reading of a component model, a runtime store, a styling system, or the DOM
  structure of a document.
- No second application-module predicate inside the adapter, which would drift from the
  neutral one; the document seam supplies the fact instead.
- No transform, and no change to the runtime, the UI, the router or the acceptance
  application.

## Proof

| Command                                              | Result                           |
| ---------------------------------------------------- | -------------------------------- |
| `corepack pnpm --filter @navirox/source-vanilla build` | `tsc --build`, no output       |
| `corepack pnpm --filter @navirox/source-vanilla test`  | 21 passed (1 file)             |
| `corepack pnpm --filter @navirox/cli test`             | 89 passed (7 files, twelve adapters registered) |
| `corepack pnpm build` / `typecheck` / `test`           | 29 / 54 / 53 tasks successful  |
| `corepack pnpm lint` / `format:check` / `deps:check`   | no output / clean / no issues  |
| Detox journey, canary untouched                        | 4/4 Android, 4/4 iOS           |

The fixtures cover both directions of the one risk this adapter carries. `vanilla-app`
has a document and no framework and is claimed. `vanilla-bad` is a library with no
document at all, and the adapter claims nothing for it, which is the honest answer for a
package that is not a web application.
