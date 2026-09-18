# PRD — Navirox: Universal Web → Native Mobile Platform

**Status:** Repositioned product definition  
**Date:** 2026-09-18  
**Audience:** maintainers, coding agents, contributors, early design partners  
**Repository strategy:** evolve the existing Navirox codebase; do not restart

---

## 1. Executive summary

Navirox is evolving from a Vue-focused native mobile stack into a framework-agnostic platform for turning existing web applications into native mobile applications.

The product does not promise a magical one-click translation of every line of web UI. Instead, it provides a systematic journey:

1. detect the web stack;
2. analyze the application;
3. identify reusable logic;
4. identify browser-only assumptions;
5. classify screens, components, dependencies and capabilities;
6. automatically migrate what is safe;
7. replace web-specific capabilities with native equivalents;
8. isolate what requires a native rewrite;
9. generate or maintain a mobile workspace;
10. provide truthful compatibility and migration guidance;
11. build and ship through supported native target backends.

The strategic wedge remains Vue/Nuxt because the repository already contains valuable Vue-native work. The universal architecture is introduced now so that the project does not accumulate unnecessary Vue coupling.

---

# 2. Product thesis

Many teams have a mature web application but no equivalent native mobile application. Their current options tend to be expensive or compromise-heavy:

- rewrite in React Native;
- rewrite in Flutter;
- keep the web app inside a native shell/WebView;
- adopt another runtime ecosystem;
- maintain independent web and mobile teams;
- manually port years of business logic and platform assumptions.

Navirox targets the gap between "wrap my website" and "rewrite my application."

### Product thesis

> A large part of a mature web application is not inherently web-only. The difficult problem is identifying the boundary between reusable application knowledge and browser-specific implementation, then providing a safe migration path.

Navirox productizes that boundary.

---

# 3. Product positioning

## 3.1 Primary positioning

> **Turn existing web applications into native mobile applications.**

## 3.2 Developer positioning

> **Bring your web codebase. Navirox tells you what can move, what must adapt, and what should become native.**

## 3.3 Technical positioning

> **A framework-agnostic analysis, compatibility, migration and native-target orchestration platform.**

## 3.4 What Navirox is not

Navirox is not:

- a generic WebView wrapper;
- a renderer brand;
- "Vue on mobile" as its final identity;
- "Expo for non-React frameworks";
- a promise to preserve 100% of web UI code;
- a universal AST-to-AST transpiler;
- a replacement for React Native, Expo, Fabric, Yoga or native platform SDKs;
- a component library;
- a low-level native rendering engine.

---

# 4. Target users

## 4.1 Primary personas

### A. Existing web product team

Has:
- production web application;
- established framework;
- shared domain logic;
- API clients;
- validation;
- state management;
- years of feature investment.

Needs:
- iOS and Android;
- a migration path rather than a rewrite;
- predictable cost and scope.

### B. Web-focused engineering team

Knows:
- Vue, Angular, Svelte or React web;
- TypeScript;
- web tooling.

Does not want:
- a separate mobile organization;
- a second product implementation with no reuse;
- opaque native plumbing.

### C. Agency / consultancy

Needs to:
- estimate web-to-mobile migration projects quickly;
- produce readiness reports;
- identify blockers before committing a fixed price;
- automate repeated migration work.

### D. Technical founder / small team

Needs:
- mobile presence quickly;
- native quality where it matters;
- incremental migration;
- one toolchain rather than multiple disconnected stacks.

## 4.2 Later enterprise persona

Large Angular / React / Vue estates needing:
- compatibility governance;
- private dependency analysis;
- migration reports;
- CI enforcement;
- framework-version upgrade intelligence;
- long-lived native modernization programs.

---

# 5. Jobs to be done

## JTBD-1 — Understand feasibility

> "I have a web app. Tell me how hard it is to make it native."

Output:
- detected stack;
- route/screen inventory;
- dependency inventory;
- browser API inventory;
- native-readiness classification;
- blocking issues;
- estimated migration categories.

## JTBD-2 — Create a mobile workspace

> "Create the native project without making me manually wire the entire toolchain."

Output:
- generated or attached mobile workspace;
- source adapter configuration;
- target/runtime configuration;
- native provider configuration;
- development command.

## JTBD-3 — Reuse the right code

> "Keep types, domain logic, API clients, validation and state where they are actually portable."

Output:
- shared-code map;
- portability diagnostics;
- extraction recommendations;
- optional codemods.

## JTBD-4 — Adapt platform-specific behavior

> "Replace browser assumptions with native capabilities."

Examples:
- storage;
- geolocation;
- file picking;
- deep linking;
- camera;
- secure storage;
- notifications;
- clipboard;
- sharing;
- network state.

## JTBD-5 — Migrate UI progressively

> "Do not force a big-bang rewrite."

Output:
- screen-by-screen plan;
- automatic transformations;
- generated native scaffolds;
- explicit manual TODOs;
- temporary fallback strategy when supported.

## JTBD-6 — Stay compatible

> "Tell me whether my dependencies and versions are known to work."

Output:
- compatibility registry result;
- version warnings;
- known-good combinations;
- CI checks;
- migration notes.

## JTBD-7 — Ship

> "Build the native app using a supported target backend."

Output:
- local build orchestration;
- supported cloud/native build integration;
- platform diagnostics;
- future submission/update orchestration.

---

# 6. Product principles

## P1 — Truth over magic

Never report unsupported code as automatically portable.

Every analyzed unit receives a reasoned classification.

## P2 — Native where native matters

A successful migration should not merely package the web application in a WebView.

Web fallback may exist as a migration strategy, but it is not the product's definition of success.

## P3 — Preserve application knowledge, not syntax at all costs

The goal is to preserve:
- domain rules;
- types;
- API contracts;
- validation;
- data flows;
- business state;
- user journeys.

The goal is not to preserve every framework-specific implementation detail.

## P4 — Progressive migration

Teams must be able to migrate:
- route by route;
- screen by screen;
- component cluster by component cluster;
- capability by capability.

## P5 — Framework adapters, not framework forks

Framework knowledge belongs in source adapters.

## P6 — Target providers are replaceable

Expo, Symbiote and other targets/runtimes are providers/integrations, not product identity.

## P7 — Compatibility is a product feature

Version knowledge and real build evidence are first-class product assets.

## P8 — The universal model must stay small

Do not encode every possible framework feature in a universal IR.

---

# 7. Source framework strategy

## 7.1 Support levels

Each source framework must have a declared support level:

- `experimental`
- `preview`
- `supported`
- `production`

Support status must be per capability where necessary, not a single marketing boolean.

## 7.2 Initial sequence

### Current wedge
- Vue 3
- Nuxt

### Architectural proof
- Svelte
- SvelteKit

### Enterprise expansion
- Angular

### Broader ecosystem
- React/Vite
- Next.js
- React Router/Remix
- Astro
- Solid/SolidStart
- Qwik
- Lit/Web Components
- Vanilla web

## 7.3 Why Svelte is second

Svelte is deliberately chosen as the second adapter because it differs enough from Vue to expose fake abstractions early, while remaining tractable enough for a focused proof.

Success criterion:

> The generic inspect/compat/planning pipeline must work for Vue and Svelte without importing either framework into the core.

---

# 8. Migration classification model

Every relevant unit can be classified as one of:

## A. Shared

Can remain identical or nearly identical.

Examples:
- TypeScript domain types
- pure functions
- schema validation
- API clients without browser assumptions
- business rules

## B. Portable

Can be transformed mechanically with high confidence.

Examples:
- simple interaction semantics
- common layout patterns
- framework-specific event binding into a target-neutral action

## C. Adaptable

Needs a known platform substitution.

Examples:
- `localStorage` → native storage
- browser geolocation → native location provider
- file input → document/image picker

## D. Native replacement

The semantic role is understood, but the implementation should become a native component/capability.

Examples:
- web map library
- complex drag/drop
- desktop-oriented rich editor
- browser media capture

## E. Web fallback

May temporarily remain web-rendered when the target/runtime supports that migration strategy.

This is a temporary migration tool, not the final quality target.

## F. Manual

Navirox cannot safely automate or recommend a canonical transformation.

The report must explain why.

---

# 9. Core product capabilities

## 9.1 `navirox init`

Responsibilities:
- detect project;
- select source adapter;
- initialize config;
- create/attach mobile workspace;
- preserve current project structure whenever possible.

## 9.2 `navirox inspect`

Must eventually report:

```text
Project
Framework
Framework version
Router
State management
Styling system
Build system
Dependencies
Routes/screens
Browser APIs
Known native capability mappings
Compatibility status
Migration classifications
Unknowns
```

## 9.3 `navirox doctor`

Validates:
- development environment;
- target/runtime requirements;
- known-good version matrix;
- incompatible packages;
- missing native configuration;
- duplicate runtime problems;
- unsupported target combinations.

## 9.4 `navirox migrate`

Does:
- safe codemods;
- source extraction;
- generated target files;
- platform substitutions;
- TODO generation;
- migration state tracking.

Does not:
- silently rewrite uncertain behavior;
- delete source code without an explicit mode;
- pretend generated code is production-ready when it is not.

## 9.5 `navirox compat`

Provides:
- package compatibility;
- version compatibility;
- capability mapping;
- evidence status;
- replacement suggestions.

## 9.6 `navirox dev`

Provides:
- current supported native development workflow;
- target-aware setup;
- clear source/target logs;
- actionable failures.

## 9.7 `navirox build`

Orchestrates a supported build provider.

No build provider is assumed to define Navirox.

---

# 10. User experience target

Example:

```bash
npx navirox init
```

```text
Navirox

✓ SvelteKit 3 detected
✓ 41 routes
✓ 132 source components
✓ Tailwind detected
✓ Zod detected
✓ 7 browser-only capabilities detected
✓ 3 unknown dependencies

Native readiness

Shared / reusable           48%
Portable                    23%
Adaptable                   18%
Native replacement           7%
Manual                       4%

Highest-impact blockers
1. Leaflet map on /explore
2. Browser drag-and-drop in /editor
3. Web Push implementation

Recommended next step:
navirox inspect --report
```

Example report detail:

```text
src/lib/auth.ts
  classification: shared
  confidence: high

src/routes/profile/+page.svelte
  classification: portable
  confidence: medium
  notes:
    - layout convertible
    - browser image input requires native picker

src/lib/map.ts
  classification: native-replacement
  replacement: native map provider
  confidence: high
```

---

# 11. MVP and scope

## 11.1 Repositioning MVP

The repositioning MVP is not "support every framework."

It is:

1. current Vue path still works;
2. generic `SourceAdapter` contract exists;
3. Vue detection/analysis sits behind that contract;
4. `inspect` can consume adapter output;
5. the core has no Vue imports;
6. the migration classification model is generic;
7. a minimal App Graph exists;
8. Svelte proof demonstrates a second adapter;
9. runtime seam remains intact;
10. repository docs accurately describe the new direction.

## 11.2 Explicit non-scope

Not required for the repositioning MVP:
- complete Nuxt migration;
- Angular support;
- Next.js support;
- full automatic UI conversion;
- production-grade universal App Graph;
- all Expo capabilities;
- all native targets;
- cloud service;
- visual editor;
- hosted compatibility portal.

---

# 12. Success metrics

Early product metrics should measure truth and migration value, not vanity.

## Technical metrics

- percentage of core packages with zero source-framework imports;
- percentage of inspection facts emitted through source adapters;
- number of validated source adapters;
- migration classifications with evidence;
- end-to-end acceptance apps per framework;
- known-good compatibility matrix size;
- unsupported cases reported correctly.

## Product metrics

- time from clone to first readiness report;
- time from supported web app to first native screen;
- percentage of original non-UI code reused;
- number of manual migration blockers found before implementation;
- percentage of automatic codemods accepted without manual rollback.

## Trust metrics

- false-positive portability rate;
- number of "unknown" results correctly surfaced rather than guessed;
- compatibility claims backed by CI/build evidence.

---

# 13. Competitive frame

Navirox should not compete on "can this framework run in a mobile shell?"

That space already includes hybrid/container approaches.

Navirox competes on:

- understanding existing applications;
- native migration planning;
- compatibility knowledge;
- incremental modernization;
- cross-framework migration intelligence;
- native target orchestration.

The product differentiator is not the renderer.

The durable assets are:

```text
source adapters
+ application analysis
+ compatibility evidence
+ migration knowledge
+ codemods
+ target mappings
+ CI matrices
+ real-world migration corpus
```

---

# 14. Monetization hypotheses

These are later hypotheses, not MVP requirements.

## Open source core
Potential OSS:
- CLI
- source adapter SDK
- basic inspect
- runtime seams
- basic migration tooling
- public compatibility data

## Paid possibilities
- private repository analysis;
- enterprise readiness reports;
- compatibility CI;
- migration plans;
- proprietary dependency knowledge;
- team dashboards;
- upgrade impact analysis;
- migration assistance;
- enterprise support/SLA;
- custom adapters.

---

# 15. Major risks

## R1 — Scope explosion

Mitigation:
- Vue/Nuxt first;
- Svelte as only second proof;
- no new adapter without a specific milestone.

## R2 — Fake universal abstraction

Mitigation:
- keep framework syntax inside adapters;
- only generalize concepts demanded by two implementations or target needs.

## R3 — Becoming a wrapper around Symbiote

Mitigation:
- preserve runtime seam;
- grow value in inspect/compat/migrate/source adapters.

## R4 — Becoming "Expo for everything"

Mitigation:
- keep target/runtime providers replaceable;
- describe Expo as an integration/target strategy.

## R5 — Overpromising automatic migration

Mitigation:
- classification + confidence + explicit unknowns;
- manual and native-replacement are valid outcomes.

## R6 — Building a compiler before validating user demand

Mitigation:
- readiness report and migration planner are useful before perfect code generation.

---

# 16. Release gates

A source adapter cannot be called `supported` until:

- detection has fixture coverage;
- parser/analyzer has representative fixture coverage;
- route discovery is tested where applicable;
- browser capability discovery is tested;
- compatibility output is stable;
- at least one end-to-end acceptance app exists;
- failure modes are documented;
- unknown syntax is surfaced rather than silently ignored.

A migration transform cannot be called safe until:

- transformation is deterministic;
- original semantics are covered by tests/fixtures;
- output is idempotent or migration-state-aware;
- rollback path is clear;
- unsupported variations are explicitly rejected.

---

# 17. Product north star

Long term:

```text
Git repository
      ↓
navirox inspect
      ↓
Native readiness model
      ↓
Migration plan
      ↓
Incremental transforms
      ↓
Native mobile workspace
      ↓
Verified iOS / Android application
```

The user should not need to understand the internal renderer to benefit from Navirox.

The platform succeeds when teams can answer:

> "What will it take to make this app native?"

before they commit to a rewrite.
