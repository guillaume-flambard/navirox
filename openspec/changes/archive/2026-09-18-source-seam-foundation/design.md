## Context

The repository has a working runtime seam: `@memolabs-apps/runtime` declares the
contract, `@memolabs-apps/runtime-symbiote` is the only package that names the
renderer, and `packages/runtime-symbiote/src/import-boundary.test.ts` fails on
the commit that breaks the rule. That test is a static scan of
`packages/*/src/**/*.ts` that strips comments, ignores `node_modules` and
`dist`, and asserts the violation list is empty.

There is no equivalent on the source side, because until now there was one
source framework and no seam to protect. Five packages exist only as declared
surfaces with no implementation (`inspect`, `compat`, `migrate`, `build`,
`config`), so the source plane is being built rather than migrated. That is why
this change can be small: it introduces the contract and the boundary, and
leaves every existing package exactly where it is.

Constraints that shape the approach: the repository must build and test after
every task; nothing may be renamed; the Vue acceptance path
(`examples/vue-basic`) must keep running unchanged; and the framework-neutral
core must stay small, because the pack explicitly rejects a grand universal
intermediate representation designed before two adapters exist.

## Goals / Non-Goals

**Goals:**

- A framework-neutral `SourceAdapter` contract and registry that a second
  framework can implement without touching generic code.
- A minimal, versioned App Graph model that inspection produces and migration
  planning will consume.
- A boundary check that makes framework leakage a test failure, in the same
  style as the renderer check that already works.
- Documents that stop describing Navirox as a Vue stack, without deleting the
  verified evidence the old plan carries.

**Non-Goals:**

- Implementing the Vue adapter, or routing `navirox inspect` through the
  registry. That is the follow-up change `vue-source-adapter`.
- Implementing `compat`, `migrate`, `build` or `config`.
- Any migration transform, code generation, or target provider.
- Nuxt, Svelte, Angular, React, Next or Astro support.
- Renaming or repackaging anything that exists.
- The two remaining gaps of the earlier Vue plan, Fast Refresh for SFC and
  stores and the release process. They are recorded as deferred, not dropped.

## Decisions

### Two packages, `@memolabs-apps/graph` and `@memolabs-apps/source`

The App Graph lives in its own package and the contract depends on it, so the
direction is `source` depends on `graph`. Consumers that only read a graph
(`inspect`, and later `compat` and a planner) then depend on `graph` without
depending on the adapter SDK.

Alternatives considered. Putting the graph inside `@memolabs-apps/source` would be one
package instead of two, but it forces every graph consumer to take a dependency
on the adapter contract, and it makes the "no framework import" rule harder to
state per package. Creating a single `@memolabs-apps/core` was rejected for the same
reason the pack rejects a grand core: it grows into the universal intermediate
representation nobody can keep honest. A separate `@memolabs-apps/planner` was
considered and rejected for now, because there is no planner logic yet and an
empty package is a promise rather than a boundary.

### The contract is semantic, and the graph is admission controlled

`SourceAdapter` exposes detection, inspection, graph construction and declared
capabilities. Parsing operations are not on the contract, so an adapter can use
its framework's own compiler without the core knowing. The graph admits a
concept only when a second adapter needs it, or a migration or target decision
consumes it, or a user-visible tool decision depends on it. Framework syntax
stays in adapter owned metadata.

### The boundary check lives in `@memolabs-apps/source`

The source plane's contract package owns the rule, the way the renderer's edge
package owns its own rule. The check is a static scan, so it needs no framework
installed and fails on the commit that breaks the rule rather than on a later
build.

The set of forbidden framework packages is declared as data in one list. A
check that the list is non-empty protects against the failure mode of an empty
rule set passing silently.

### The test task declares its inputs

The boundary check reads files outside its own package, which turbo cannot see
from a default input set. Without an explicit `inputs` on the `test` task, a
cached success can be replayed after a source file it scans has changed. The
fix is to declare the scanned sources as inputs rather than to accept a check
that can lie, which is the same class of problem the repository already hit
once on the runtime boundary test.

### The canonical documents are vendored, and the working tree copy is ignored

The pack is an input delivered by hand. Its canonical documents are copied
unchanged into `docs/repositioning/` so the direction is versioned with the
code and citable from a specification, and `navirox-repositioning-pack/` is
ignored and removed from the working tree so a second copy cannot drift.

### No changeset

The repository has no changesets at all and all fourteen packages sit at
`0.0.0`. The two new packages follow the existing convention. Recording a
changeset here would invent a release process that the release-process change
is supposed to define.

## Risks / Trade-offs

- **The contract is designed before the second adapter exists.** This is the
  main risk the pack itself warns about. Mitigation: the contract is deliberately
  small and semantic, the admission rule keeps the graph minimal, and a shared
  contract in a pre-alpha repository is expected to change once a real adapter
  pushes on it. The next change stresses it with Vue, and the Svelte proof
  stresses it with a genuinely different framework.
- **A framework list can rot.** Mitigation: it is one declared list, and a
  check asserts it is not empty. Adding a framework is a data change.
- **The boundary check is only as good as its scan.** It cannot see dynamic
  imports it is not written to look for, and it is deliberately a text scan.
  Mitigation: the renderer check uses the same technique and has already caught
  real regressions; the limitation is recorded rather than hidden.
- **Two new packages could be read as a support claim.** Mitigation: the
  README support matrix moves nothing to a supported state. The source plane
  stays honest until the Vue adapter implements the contract and passes its
  tests.

## Open Questions

- Whether `navirox inspect` should grow a `--framework` selection flag before
  there is a second adapter to select between. Deferred to
  `vue-source-adapter`, where a real second implementation, not a flag, is the
  thing being designed.
- Whether the App Graph should carry an explicit app level node. Deferred until
  an adapter needs to hang project level facts on it.
