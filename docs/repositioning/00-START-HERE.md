# Navirox — Repositioning Pack
**Date:** 2026-09-18  
**Status:** Canonical repositioning proposal for the existing pre-alpha repository  
**Intent:** Evolve the current project. Do not restart from zero.

## 1. Read this first

Navirox is being repositioned from:

> **The native mobile stack for Vue teams**

to:

> **The framework-agnostic Web → Native Mobile platform.**

The implementation strategy is intentionally narrower than the vision:

> **Universal architecture now. Vue/Nuxt first. Svelte/SvelteKit second as the first proof that the architecture is truly framework-agnostic. Angular next.**

This is not a big-bang rewrite. Existing work is preserved, especially:

- `@navirox/runtime`
- `@navirox/runtime-symbiote`
- `@navirox/ui`
- `@navirox/native`
- `@navirox/router`
- `@navirox/cli`
- `@navirox/doctor`
- `@navirox/compat`
- `@navirox/inspect`
- `@navirox/migrate`
- `@navirox/build`
- `create-navirox`
- the current runtime-boundary tests
- the existing acceptance application and build evidence
- the rule that Symbiote is replaceable infrastructure, not product identity

The repositioning adds a **source seam** in front of the existing platform.

## 2. Canonical product definition

Navirox analyzes an existing web application, builds a framework-independent model of the parts that matter for mobile migration, classifies each part by migration strategy, and helps produce a native mobile application while preserving as much useful source logic as possible.

The product is not defined by:

- Vue
- Symbiote
- Expo
- React Native
- a specific renderer
- a single migration technique

Those may be important implementations or integrations, but none define the product.

### Canonical one-line positioning

> **Turn existing web applications into native mobile applications.**

### More precise technical positioning

> **Navirox is a framework-agnostic analysis, compatibility and migration platform for moving web application codebases toward native mobile targets.**

## 3. Product wedge

The universal vision must not become universal scope.

### Initial support order

1. **Vue 3** — current reference source adapter
2. **Nuxt** — first framework layer on top of Vue
3. **Svelte / SvelteKit** — second independent source model; architectural proof
4. **Angular** — enterprise-oriented source adapter
5. **React / Vite**
6. **Next.js / React Router / Remix**
7. **Astro** — meta-adapter capable of dispatching islands to other adapters
8. **Solid / SolidStart**
9. **Qwik**
10. **Lit / Web Components**
11. **Vanilla HTML/CSS/JS**
12. server-rendered ecosystems later, only when a real user case justifies them

The order is directional, not a public support promise.

## 4. The central architecture

```text
Web codebase
    │
    ├── Vue / Nuxt
    ├── Svelte / SvelteKit
    ├── Angular
    ├── React / Next
    ├── Astro
    └── ...
    │
    ▼
Source Detection
    │
    ▼
Source Adapter
    │
    ▼
Minimal Navirox App Graph
    │
    ├── routes
    ├── screens
    ├── state/data dependencies
    ├── actions/events
    ├── platform/browser capabilities
    ├── component relationships
    └── dependency/compatibility facts
    │
    ▼
Migration Planner
    │
    ├── shared
    ├── portable
    ├── adaptable
    ├── native replacement
    ├── web fallback
    └── manual
    │
    ▼
Target Strategy
    │
    ├── current native runtime path
    ├── Expo/React Native migration path
    └── future target providers
    │
    ▼
iOS / Android
```

## 5. The two seams

Navirox already has the beginning of a **runtime seam**:

```text
Navirox public surface
        ↓
@navirox/runtime
        ↓
@navirox/runtime-symbiote
        ↓
Symbiote / React Native / Fabric
```

The repositioning adds a **source seam**:

```text
Vue ───────────┐
Svelte ────────┤
Angular ───────┤
React ─────────┤
Astro ─────────┤
               ↓
        SourceAdapter
               ↓
          Navirox Core
```

The source seam is the key structural change.

## 6. Critical rule: do not invent a giant universal compiler IR

The App Graph must be **minimal and evidence-driven**.

A concept enters the shared App Graph only when at least one of these is true:

1. two source adapters need the same semantic concept;
2. a target/migration decision needs the concept;
3. `inspect`, `compat`, `doctor` or `migrate` needs it for a user-visible decision.

Framework-specific syntax and implementation details remain inside source adapters.

Bad:

```text
UniversalAbstractReactiveDirectiveNodeFactory
```

Good:

```text
Action
Route
Screen
DataSource
PlatformCapability
MigrationClassification
```

## 7. Document precedence

When an AI agent works on this repository, use this precedence:

1. `AGENT-GUIDE.md`
2. `ARCHITECTURE.md`
3. `MIGRATION-PLAN.md`
4. `PRD.md`
5. `BLUEPRINT.md`
6. `ROADMAP.md`
7. existing repository `PLAN.md`, `blueprint.md`, and README as historical/current implementation evidence

If the old repository documents conflict with this pack on product direction, this repositioning pack wins.  
If the old repository contains verified technical evidence about the current implementation, that evidence remains valid unless new evidence disproves it.

## 8. What must not happen

Do not:

- delete the working runtime architecture and restart;
- replace every package at once;
- promise all frameworks immediately;
- make Expo the product identity;
- make Symbiote the product identity;
- make React Native the public conceptual model;
- add source-framework-specific logic to framework-neutral core packages;
- create an IR based on imagination rather than implementation pressure;
- claim "100% automatic conversion";
- confuse wrapping a web app in a WebView with native migration;
- build five source adapters before one end-to-end path works;
- refactor package names merely for aesthetic consistency before functionality requires it.

## 9. Immediate objective

The next architectural milestone is:

> **Make the current Vue path look like the first implementation of a generic SourceAdapter contract without changing its observable behavior.**

The milestone after that is:

> **Implement enough Svelte support to prove that the same inspect / compatibility / planning core can consume a second source framework.**

Everything else follows from those two proofs.
