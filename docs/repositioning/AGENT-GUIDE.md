# AGENT GUIDE — Working on Navirox After the Repositioning

**Audience:** AI coding agents, autonomous implementation agents, contributors using AI.

This document exists to prevent a capable agent from optimizing the wrong product.

---

# 1. Mission

You are working on an existing pre-alpha repository named Navirox.

Do not rebuild it from scratch.

Your mission is:

> Evolve Navirox from a Vue-focused native stack into a framework-agnostic Web → Native Mobile platform while preserving the current working Vue/runtime assets.

The execution wedge remains Vue/Nuxt.

Do not implement every planned framework unless the assigned task explicitly requires it.

---

# 2. Canonical product direction

Navirox is:

> A framework-agnostic analysis, compatibility and migration platform that helps teams turn existing web applications into native mobile applications.

Navirox is not defined by:
- Vue;
- Symbiote;
- Expo;
- React Native.

These can be adapters, providers or infrastructure.

---

# 3. Before modifying code

For every task:

1. read the task;
2. identify which architectural layer it belongs to;
3. inspect existing implementation;
4. preserve current tests/evidence;
5. decide whether the change is generic, source-specific, target-specific or runtime-specific;
6. put it in the correct boundary;
7. add/update tests;
8. update docs only when behavior is actually supported.

Do not begin with mass renames.

---

# 4. Layer classification checklist

Ask:

## Is this source-framework knowledge?

Examples:
- Vue SFC parsing;
- Svelte syntax;
- Angular decorators;
- Next routing conventions.

→ Put in `source-*`.

## Is this generic migration knowledge?

Examples:
- migration classification;
- evidence;
- App Graph;
- planner.

→ Put in generic core.

## Is this native target knowledge?

Examples:
- Expo Router output;
- React Native primitive generation.

→ Put in target provider.

## Is this runtime-provider knowledge?

Examples:
- Symbiote imports;
- provider-specific native host behavior.

→ Put in runtime provider.

## Is this product orchestration?

Examples:
- CLI;
- inspect;
- migrate;
- doctor;
- reports.

→ Orchestrate abstractions; do not embed framework/provider logic.

---

# 5. Hard prohibitions

## Never put Vue-specific imports in generic core

If you are about to import `vue`, `@vue/compiler-*` or Nuxt packages into:
- graph;
- planner;
- generic inspect;
- generic migrate;
- compat core;
- build core;

stop and move the logic into `source-vue`/`source-nuxt`.

The same rule applies to Svelte/Angular/React later.

## Never put Symbiote imports outside the permitted runtime edge

Preserve existing boundary rules.

## Never make Expo the identity

Do not write generic APIs named around Expo unless the package is explicitly an Expo target/provider.

Bad:

```ts
interface ExpoMigrationNode {}
```

Generic core should say:

```ts
interface MigrationDecision {}
```

## Never claim a framework is supported because detection works

Support is capability-based and must be backed by tests/evidence.

## Never silently classify unknown code as portable

Return `unknown` or `manual`.

## Never build a giant universal IR spec upfront

Add semantic concepts only when real adapters/targets need them.

## Never replace deterministic evidence with LLM guesses

Compiler output, ASTs, manifests, dependency graphs and build evidence beat probabilistic inference.

---

# 6. Preserve the current repository

The current project contains valuable work.

Treat these as assets unless a task explicitly changes them:

- runtime seam;
- runtime-symbiote provider;
- runtime boundary tests;
- current Vue SFC native path;
- metro preset;
- existing CLI scaffolding;
- doctor;
- package layout;
- acceptance fixtures;
- CI;
- build evidence.

A repositioning task is not permission to delete working code.

---

# 7. App Graph rules

The App Graph is a migration model, not a syntax tree.

Allowed generic concepts include:
- app;
- route;
- screen;
- unit;
- action;
- data;
- capability;
- dependency;
- finding;
- evidence.

Framework concepts should remain adapter metadata.

Before adding a new App Graph node type, answer:

1. Which second framework needs this concept?
2. Which migration/target decision uses it?
3. Could it remain adapter metadata instead?

If answers are weak, do not add it.

---

# 8. Source adapter rules

Every source adapter must:

- expose stable id;
- detect with evidence;
- declare support level;
- normalize paths;
- preserve source locations;
- not import target providers;
- convert unsupported syntax into findings/unknowns rather than crashes;
- have fixtures.

An adapter may use the framework's official compiler API.

Prefer official compiler/parser APIs to hand-written parsing.

---

# 9. Migration decision rules

Every decision must include:
- classification;
- confidence;
- reason;
- evidence.

Valid classifications:

```text
shared
portable
adaptable
native-replacement
web-fallback
manual
unknown
```

Do not return `portable` merely because code parses.

---

# 10. AI use inside Navirox

If implementing AI features:

Preferred:

```text
deterministic facts
+ compatibility data
+ structured AI suggestion
+ validation
```

Forbidden product behavior:

```text
LLM says it probably works
→ mark supported
```

AI suggestions must be clearly distinguishable from verified facts.

---

# 11. Coding task workflow

For each implementation ticket:

## Step A — State the boundary

Example:

> This is Vue source analysis and belongs in `@memolabs-apps/source-vue`.

## Step B — Add/modify contract only if necessary

Do not modify generic contracts for convenience.

## Step C — Add fixture first for parser/analyzer changes

Fixture should represent real framework syntax.

## Step D — Implement narrow behavior

Avoid speculative features.

## Step E — Add negative fixture

Unsupported/ambiguous input should produce a finding.

## Step F — Run boundary tests

Check:
- no source framework leak;
- no runtime provider leak.

## Step G — Run existing acceptance tests

No regression in current Vue native path.

## Step H — Update documentation

Only documented support that exists.

---

# 12. Contract-change policy

The project is pre-alpha, so bad contracts may be changed.

But every shared-contract change must answer:

- why current contract is insufficient;
- which real adapter/target demonstrated the need;
- why adapter metadata is insufficient;
- whether schema version changes.

Do not preserve a bad abstraction merely because it was introduced one day earlier.

---

# 13. Package naming policy

Do not spend implementation cycles renaming packages for conceptual purity.

Prefer:
- introduce new boundary;
- deprecate old name later;
- maintain compatibility aliases if public releases already exist.

Today the repository is pre-alpha, but working build scripts/evidence still matter.

---

# 14. Documentation policy

Use precise status language.

Good:
- "planned";
- "experimental";
- "detected";
- "inspection support";
- "migration rule implemented";
- "iOS build verified."

Bad:
- "supports Angular" when only package detection exists;
- "automatic migration" when code generation is a scaffold;
- "Expo compatible" without build proof.

---

# 15. How to interpret old documents

The old `PLAN.md`, `blueprint.md`, README and architecture docs contain implementation evidence from the Vue-focused phase.

Use them for:
- current package responsibilities;
- verified upstream behavior;
- known runtime constraints;
- build/toolchain facts.

Do not use them to override the new product direction.

If old docs say:

> Navirox is the native mobile stack for Vue teams

interpret it as:

> the current implementation wedge is Vue.

---

# 16. Default decision hierarchy

When uncertain:

1. preserve working behavior;
2. preserve boundary isolation;
3. prefer truthful unknown over guessed support;
4. keep generic core smaller;
5. keep framework behavior in adapters;
6. keep target behavior in providers;
7. add tests/evidence;
8. optimize DX after correctness.

---

# 17. First architecture objective for an agent

If asked to "start the repositioning", do not add Angular/Svelte immediately.

Start with:

```text
1. add @memolabs-apps/source contract
2. add minimal App Graph schema
3. add source-vue
4. route inspect through registry
5. add no-framework-import boundary test
6. keep Vue acceptance green
```

Then implement the Svelte proof.

---

# 18. Definition of a successful change

A change is successful if:

- it moves the project toward framework-agnostic architecture;
- it does not exaggerate current support;
- it preserves current working assets;
- it has evidence/tests;
- it does not leak provider/framework concepts into generic core;
- it remains understandable to the next agent.

---

# 19. Suggested agent status report format

After a task, report:

```text
Implemented
- ...

Architecture
- boundary used:
- contracts changed:
- new framework/provider coupling:

Tests
- ...

Evidence
- ...

Not implemented
- ...

Follow-up
- ...
```

This makes agent work auditable.

---

# 20. Ultimate test

Before merging a core change, ask:

> If tomorrow we add a Svelte adapter and replace Symbiote with another runtime, does this core change still make sense without renaming its concepts?

If no, the abstraction is probably in the wrong layer.
