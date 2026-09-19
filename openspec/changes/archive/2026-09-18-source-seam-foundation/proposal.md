## Why

Navirox is now positioned as the framework-agnostic Web to Native Mobile
platform, but the repository is still shaped around one source framework. The
README, `AGENTS.md`, `PLAN.md` and the package surface all describe a Vue stack,
and there is nowhere for a second source framework to plug in.

The runtime side already solved this problem for the renderer: exactly one
package names it, and a test fails on the commit that breaks the rule. Nothing
equivalent exists on the source side, so every framework after Vue would mean
branching the tooling instead of implementing a contract.

This change adds that contract. It is deliberately the smallest step that makes
the architecture honest: two new packages, one boundary test, and the documents
that still contradict the repositioning. Nothing observable changes, and the
Vue path keeps running exactly as it does today.

Scope note. This is the `source-seam-foundation` change from
`docs/repositioning/MIGRATION-PLAN.md` (phases 0 and 1, plus the boundary test
of phase 3). Routing `navirox inspect` through the registry, and implementing
the Vue adapter behind it, belong to the follow-up change `vue-source-adapter`.

## What Changes

- Vendor the canonical repositioning documents under `docs/repositioning/` and
  stop carrying a second copy of the pack in the working tree.
- Add `@memolabs-apps/graph`, a dependency-free package holding the versioned App
  Graph v1 model: routes, screens, units, actions, data, capabilities,
  dependencies, edges, findings and evidence, all traceable to a source
  location.
- Add `@memolabs-apps/source`, a dependency-free package holding the `SourceAdapter`
  contract, the adapter registry, and the detection and inspection types an
  adapter passes through.
- Add a framework import boundary test that fails when a generic package
  imports a source framework, or when a source adapter imports a target
  provider. The existing renderer boundary test stays as it is.
- Reposition the documents that still define Navirox as a Vue stack: `README.md`
  (positioning, architecture with both seams, package states, support status
  matrix), `AGENTS.md` (product definition plus the new source isolation rule),
  and `PLAN.md` (a notice that the repositioning documents define direction
  while the plan remains the implementation evidence for the Vue path).
- Fill `openspec/config.yaml` with the repository context and per-artifact
  rules, so every later change is written with the same constraints in hand.
- Make the workspace see the new packages: project references in
  `tsconfig.json`, and `inputs` on the test task so a boundary test that reads
  files outside its own package cannot be served from a stale cache.

## Capabilities

### New Capabilities

- `source-adapter`: the framework-neutral contract a source framework is
  addressed through, and the registry the tooling discovers adapters with.
- `app-graph`: the minimal, versioned, framework-neutral model of a web
  application that inspection produces and migration planning will consume.
- `architecture-boundaries`: the enforced rule that framework knowledge stays
  inside source adapters and never reaches generic core.

### Modified Capabilities

None. No requirement in an existing specification changes. There are no
published capabilities yet; `openspec/specs/` is empty.

## Impact

- New packages: `@memolabs-apps/graph`, `@memolabs-apps/source`. Both depend on nothing,
  import no framework, and publish no provider type.
- Modified: `tsconfig.json` (project references), `turbo.json` (test inputs),
  `README.md`, `AGENTS.md`, `PLAN.md`, `.gitignore`.
- New files: `docs/repositioning/` (eight vendored canonical documents),
  `openspec/config.yaml` content.
- Not touched: every existing package's public surface and behaviour,
  `examples/vue-basic`, the CI workflow, the Detox harness.
- Deferred, and recorded as deferred rather than dropped: Fast Refresh for SFC
  and stores, and the release process (changesets plus a tagged `0.1.0`). Both
  belong to the earlier Vue plan and are not part of the repositioning.
