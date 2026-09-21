# ROADMAP — Navirox Repositioning

This roadmap separates **product vision**, **platform architecture**, and **framework support** so the project does not explode in scope.

## Current execution order

Source-adapter completion is the active product path. The order is Vue, Angular,
Nuxt, then Next. React remains covered by the public analyzer because it is the
base adapter for Next.

For an adapter, **complete source support** means all of the following hold
against its versioned fixture corpus and the installed public package:

1. `npx navirox analyze . --json` identifies the adapter without relying on the
   checkout;
2. inspection produces a deterministic source graph, or explicitly reports the
   construct it cannot establish;
3. `navirox plan` accepts that graph and preserves every uncertainty in its
   output;
4. `navirox migrate` copies only units classified as shared or portable, with
   idempotence and rollback verified;
5. no framework-specific rule escapes its adapter into the neutral source,
   inspect, planner or migration modules.

This is not a claim that every web view is converted automatically, nor that a
native runtime exists for every source framework. Those are separate target
provider and transform gates. The supported migration contract remains the
safe subset that Navirox can prove.

Visual fidelity is a separate commercial gate. Until a generated native view
tree and reproducible visual evidence exist, no adapter may claim visual parity
or offer a web-to-native image diff. `docs/VISUAL-FIDELITY.md` defines the
required evidence and puts the Vue target-provider proof before visual claims
for every other adapter.

---

# Stage A — Reposition (now)

### Objective
Change the product definition without breaking the current implementation.

Deliver:
- canonical PRD/blueprint/architecture;
- README positioning update;
- support-status table;
- source adapter contract;
- architecture boundary rules.

Exit:
> Navirox is architecturally allowed to support any source framework, but still only claims current Vue capabilities.

---

# Stage B — Vue becomes Adapter #1

Deliver:
- `@memolabs-apps/source-vue`;
- Vue detection;
- graph extraction;
- generic inspect flow;
- migration decision model;
- browser capability detection;
- source-neutral report schema.

Exit:
> Current Vue behavior is preserved and Vue-specific analysis is behind an adapter boundary.

---

# Stage C — Nuxt migration intelligence

Deliver:
- `@memolabs-apps/source-nuxt`;
- route/page/layout discovery;
- composable analysis;
- Nuxt browser/server boundary findings;
- shared-code report;
- migration suggestions.

Exit:
> Existing Nuxt projects receive a useful readiness report even before full automatic migration exists.

---

# Stage D — Svelte proof

Deliver:
- Svelte detection;
- Svelte component analysis;
- SvelteKit routes;
- same generic report pipeline;
- cross-adapter fixtures.

Exit:
> The architecture has two genuinely different source frameworks and the generic core remains framework-neutral.

This is the primary GO/NO-GO gate for the universal positioning.

---

# Stage E — Migration engine v1

Deliver:
- migration state file;
- transform pipeline;
- safe generic transforms;
- Vue transforms;
- target transforms;
- unit-by-unit migration command;
- rollback/idempotency rules.

Exit:
> Navirox does more than inspect: it safely automates a meaningful portion of one real migration.

---

# Stage F — Angular preview

Deliver:
- detection;
- routes;
- components;
- services;
- RxJS/signals inventory;
- forms;
- Angular Material findings;
- platform capability analysis.

Exit:
> Angular projects receive an honest readiness report and first migration plan.

---

# Stage G — Target expansion

Only after source architecture is stable.

Evaluate:
- current native runtime path;
- Expo/React Native generation;
- hybrid migration strategies;
- EAS or other build providers.

Exit:
> Target providers are explicit and replaceable.

---

# Stage H — React / Next

Deliver:
- React source adapter;
- Next source adapter;
- server/client boundary detection;
- route analysis;
- dependency mapping.

Do not let React-specific closeness to React Native reshape generic core.

---

# Stage I — Astro composition

Deliver:
- Astro parser;
- page/static analysis;
- islands;
- delegation to Vue/Svelte/React adapters;
- mixed-framework report.

Exit:
> Navirox can analyze one application containing multiple UI framework islands.

---

# Stage J — Compatibility network

Deliver:
- public registry;
- CI evidence;
- versioned mappings;
- package replacement knowledge;
- community contribution format.

Exit:
> Compatibility knowledge becomes a durable product asset.

---

# Stage K — Enterprise / Cloud

Potential:
- private repository reports;
- dashboards;
- migration programs;
- CI gates;
- upgrade impact;
- custom adapters;
- support/SLA.

Only build with user demand.

---

# Support status policy

Publicly use:

```text
Experimental
Preview
Supported
Production
```

Never use a binary "supported" logo before the contract gates are met.

Example future matrix:

| Adapter | Detect | Inspect | Plan | Migrate | Status |
|---|---:|---:|---:|---:|---|
| Vue | ✓ | ✓ | ✓ | partial | Preview |
| Nuxt | ✓ | ✓ | ✓ | partial | Preview |
| Svelte | ✓ | ✓ | partial | — | Experimental |
| Angular | ✓ | partial | — | — | Experimental |
| React | planned | — | — | — | Planned |

---

# What wins over roadmap dates

Roadmap order may change based on:
- real users;
- migration projects;
- upstream runtime changes;
- build feasibility;
- framework demand.

Architectural invariants do not change merely to hit a date.
