# MIGRATION PLAN — Evolve Current Navirox into Universal Web → Native

**Strategy:** Brownfield evolution, no restart.  
**Primary objective:** Generalize the architecture without stopping current Vue progress.

---

# 1. Migration rules

1. Working behavior is an asset.
2. No big-bang package rewrite.
3. No simultaneous multi-framework implementation.
4. Vue remains the production/acceptance reference until another adapter earns support.
5. Generic core may not import source frameworks.
6. Runtime seam remains independent.
7. Every migration phase must leave the repository buildable.
8. Rename only when a rename solves an actual boundary problem.

---

# 2. Current assets to preserve

Based on the current repository structure:

- monorepo/tooling;
- CI;
- changesets;
- TypeScript setup;
- `@navirox/runtime`;
- `@navirox/runtime-symbiote`;
- runtime boundary tests;
- `@navirox/metro-preset`;
- current SFC/native bootstrap path;
- `@navirox/ui`;
- `@navirox/native`;
- `@navirox/router`;
- `create-navirox`;
- `@navirox/cli`;
- `@navirox/doctor`;
- current build evidence;
- acceptance app;
- declared packages for inspect/compat/migrate/build.

Do not throw them away to fit the new architecture.

---

# 3. Phase 0 — Reposition documentation only

## Goal

Make the new direction explicit before architecture work diverges.

## Changes

- add new canonical docs;
- update README positioning carefully;
- keep current support honest.

Recommended README positioning:

> **The Web → Native Mobile platform. Vue first.**

Then:

```text
Current implementation: Vue 3
Next: Nuxt migration intelligence
Architectural proof: Svelte/SvelteKit
Planned: Angular and additional web frameworks
```

## Do not

- claim Svelte/Angular support;
- remove current Vue usage docs.

## DoD

- product wording updated;
- status still says pre-alpha;
- support matrix exists;
- old Vue docs clearly remain current implementation docs.

---

# 4. Phase 1 — Introduce source contracts

## Goal

Add source abstraction without moving current implementation.

## Add

```text
packages/source/
```

or flat equivalent:

```text
packages/source-core
```

Prefer published package name:

```text
@navirox/source
```

## Implement

- `SourceAdapter`;
- `SourceAdapterRegistry`;
- detection result types;
- source inspection types;
- App Graph v1 schema in a separate generic package if needed.

## Do not

- move Metro;
- move runtime;
- rewrite Vue compiler logic;
- add Svelte yet.

## DoD

- package compiles;
- zero Vue dependencies;
- contract tests exist;
- CLI can load registry in a test.

---

# 5. Phase 2 — Create `source-vue` as a facade over existing behavior

## Goal

Make Vue the first adapter without changing user behavior.

Add:

```text
@navirox/source-vue
```

Initially it may delegate to existing code.

Responsibilities:
- Vue detection;
- `package.json` evidence;
- Vue version;
- Vite/known build tool detection;
- `.vue` unit discovery;
- simple route discovery where existing information exists;
- browser API discovery;
- graph output.

Do not force all Vue-specific code to move immediately.

## DoD

```text
navirox inspect <vue-fixture>
```

selects `source-vue` through the registry.

---

# 6. Phase 3 — Generalize `inspect`

## Goal

Turn `@navirox/inspect` into an adapter orchestrator.

Before:

```text
inspect assumes Vue
```

After:

```text
inspect
  → detect adapter
  → inspect source
  → graph
  → compat
  → planner
  → report
```

## Required outputs

- human report;
- JSON report with schema version.

## DoD

No `vue` import in `@navirox/inspect`.

---

# 7. Phase 4 — Generic migration classifications

## Goal

Introduce stable decision vocabulary.

Add:
- classification enum;
- confidence;
- reasons;
- evidence;
- blockers;
- target mapping.

Implement first rules:

```text
pure TS → shared
browser local storage → adaptable
browser geolocation → adaptable
known DOM-only dependency → manual/native-replacement
unknown dependency → unknown
```

## DoD

Planner works with fixture data independent of Vue.

---

# 8. Phase 5 — Generalize `compat`

## Goal

Move compatibility from runtime-version knowledge toward source-to-target knowledge.

Registry should support:

- source framework/version;
- npm package/version;
- capability;
- target provider;
- runtime provider;
- platform;
- evidence.

## Migration

Do not delete existing runtime compatibility facts.

Wrap/migrate them into the new schema.

## DoD

Current runtime doctor checks still work.

---

# 9. Phase 6 — Introduce migration state

Add:

```text
.navirox/migration.json
```

Versioned schema.

Track:
- adapter;
- source fingerprint;
- target;
- per-unit status;
- user overrides;
- generated outputs.

DoD:
- repeated migrate commands do not blindly duplicate work.

---

# 10. Phase 7 — Generalize `migrate`

## Goal

Split transforms into:

```text
source transforms
generic transforms
target transforms
```

Refactor existing/future Vue codemods to implement source migration provider interface.

## DoD

No framework imports in migrate core.

---

# 11. Phase 8 — Formalize target/provider boundary

## Goal

Stop future build/migration code from assuming one backend.

Add:
- `TargetProvider`;
- `BuildProvider` if separate;
- current native/runtime strategy as first implementation.

Do not rewrite runtime packages.

## DoD

Planner references target provider id, not Symbiote directly.

---

# 12. Phase 9 — Svelte architectural proof

## Goal

Prove universality.

Build a deliberately limited adapter:

```text
@navirox/source-svelte
```

Support:
- project detection;
- Svelte version;
- component discovery;
- imports;
- simple actions;
- browser capabilities.

Then:

```text
@navirox/source-sveltekit
```

Support:
- route discovery;
- page/layout mapping.

## Acceptance fixture

Create equivalent tiny apps:

```text
examples/inspect-vue
examples/inspect-svelte
```

Same user journey:
- list;
- detail;
- storage use;
- geolocation use;
- API client;
- validation;
- simple state.

Compare reports.

## GO gate

Proceed to broad framework roadmap only if:
- core did not require Svelte-specific hacks;
- App Graph did not explode in size;
- report model stayed stable;
- at least 70–80% of generic findings use identical core rules.

If this fails, fix abstractions before Angular.

---

# 13. Phase 10 — Nuxt depth

Vue remains wedge; after source seam exists, invest in high-value Nuxt knowledge:

- pages/router;
- layouts;
- composables;
- Pinia;
- `useFetch`;
- `useAsyncData`;
- runtime config;
- plugins;
- server/client boundaries;
- auto imports.

Focus on readiness/migration intelligence before total codegen.

---

# 14. Phase 11 — Angular adapter

Only after Svelte proof.

Start with:
- detection;
- standalone components/modules;
- templates;
- router;
- services;
- browser APIs;
- dependency inventory.

Then:
- signals;
- RxJS;
- forms;
- Angular Material mappings.

Do not attempt full Angular→native codegen as first milestone.

---

# 15. Phase 12 — React/Next

React may be easier syntactically for Expo-related targets, but that does not mean it should distort the core.

Keep React-specific concepts in adapter:
- hooks;
- JSX;
- Next server/client boundaries;
- React Server Components;
- actions.

---

# 16. Phase 13 — Astro composition

Implement Astro only after at least:
- Vue adapter;
- Svelte adapter;
- React adapter.

Astro should delegate islands to those adapters where possible.

---

# 17. Package transition table

| Current package | Action |
|---|---|
| `@navirox/runtime` | Keep |
| `@navirox/runtime-symbiote` | Keep |
| `@navirox/ui` | Keep |
| `@navirox/native` | Keep |
| `@navirox/router` | Keep; clarify target vs source routing responsibilities |
| `@navirox/metro-preset` | Keep; treat as Vue/runtime build implementation |
| `@navirox/cli` | Keep; make adapter-aware |
| `@navirox/doctor` | Keep; source-neutral core |
| `@navirox/inspect` | Generalize |
| `@navirox/compat` | Generalize |
| `@navirox/migrate` | Generalize |
| `@navirox/build` | Generalize around providers |
| `@navirox/config` | Extend |
| `create-navirox` | Keep; later allow source detection / attach mode |
| new `@navirox/source` | Add |
| new `@navirox/source-vue` | Add |
| new `@navirox/graph` | Add only if useful as separate package |
| new `@navirox/planner` | Add only when logic justifies package |

---

# 18. README migration

Do not oversell.

Recommended structure:

```text
Navirox
The Web → Native Mobile platform.

Current status: pre-alpha.

Today:
- Vue 3 native path
- runtime seam
- scaffolder/dev tooling foundations

Being built:
- framework-neutral inspect / migration architecture
- Nuxt migration intelligence

Planned source adapters:
- Svelte/SvelteKit
- Angular
- React/Next
- Astro
```

Avoid support logos with green checkmarks for unimplemented adapters.

---

# 19. Existing PLAN.md strategy

The current `PLAN.md` contains verified implementation evidence and should not simply be deleted.

Recommended:

1. rename conceptually to "Vue implementation plan" later, or
2. prepend a notice:
   - repositioning docs define product direction;
   - this plan remains implementation evidence for current Vue/runtime path.

Do not lose upstream verification notes.

---

# 20. First concrete issue sequence

Suggested first issues:

### NX-U001 — Add framework-neutral source adapter contract
Acceptance:
- new package;
- no framework deps;
- registry;
- contract tests.

### NX-U002 — Add App Graph v1 minimal schema
Acceptance:
- versioned;
- route/unit/capability/dependency;
- source location;
- findings/evidence.

### NX-U003 — Implement Vue source detection adapter
Acceptance:
- detects Vue fixture;
- records evidence/version;
- does not change current runtime.

### NX-U004 — Route `navirox inspect` through adapter registry
Acceptance:
- Vue fixture uses source-vue;
- inspect core has no Vue dependency.

### NX-U005 — Add migration decision model + generic planner skeleton
Acceptance:
- shared/portable/adaptable/native/manual/unknown;
- reasons/evidence required.

### NX-U006 — Add browser capability analyzer contract
Acceptance:
- localStorage;
- geolocation;
- file input/DOM usage first set.

### NX-U007 — Upgrade compatibility schema
Acceptance:
- old runtime facts preserved;
- source/target constraints supported.

### NX-U008 — Add source framework boundary test
Acceptance:
- CI fails if generic core imports source framework.

### NX-U009 — Create Svelte inspection fixture
No adapter yet; define expected semantic report.

### NX-U010 — Implement minimal Svelte adapter
Acceptance:
- same inspect pipeline;
- report generated;
- no core hacks.

---

# 21. Things explicitly postponed

Until Svelte proof:

- Angular implementation;
- Astro;
- React/Next;
- universal code generation;
- hosted cloud platform;
- visual migration editor;
- automatic target selection AI;
- complex design-system translation.

---

# 22. Rollback strategy

This migration should be reversible in small pieces.

If source seam experiment fails:
- current Vue runtime remains;
- new source packages can be isolated;
- no need to revert runtime work.

If Svelte exposes a bad abstraction:
- change App Graph v1 while still pre-alpha;
- retain adapter fixture as test evidence;
- do not preserve a bad public contract merely for internal compatibility.

---

# 23. Repositioning completion gate

The repositioning is complete when all are true:

```text
[ ] README reflects universal vision honestly
[ ] SourceAdapter exists
[ ] source-vue exists
[ ] inspect core is framework-neutral
[ ] App Graph v1 exists
[ ] migration classifications exist
[ ] compat can model source→target facts
[ ] framework boundary test exists
[ ] current Vue acceptance path still works
[ ] Svelte inspect proof passes
[ ] docs and code no longer define Navirox as only Vue
```
