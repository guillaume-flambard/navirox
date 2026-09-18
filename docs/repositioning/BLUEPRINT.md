# BLUEPRINT — Navirox Universal Web → Native

**Purpose:** Canonical product/technical blueprint after repositioning  
**Rule:** Evolve the current repository; do not rebuild from scratch.

---

# 1. New definition

Old:

> Native mobile stack for Vue teams.

New:

> **Framework-agnostic Web → Native Mobile platform.**

Execution strategy:

> **Vue/Nuxt remains the first-class wedge. The platform architecture becomes generic now.**

---

# 2. Core mental model

Navirox has four conceptual planes:

```text
1. SOURCE PLANE
2. ANALYSIS / MIGRATION CORE
3. TARGET / RUNTIME PLANE
4. TOOLCHAIN / PRODUCT EXPERIENCE
```

## Source plane

Understands source-framework syntax and conventions.

Examples:
- Vue
- Nuxt
- Svelte
- SvelteKit
- Angular
- React
- Next
- Astro

## Analysis / migration core

Understands:
- routes/screens;
- actions;
- data dependencies;
- browser/platform capabilities;
- source dependencies;
- migration classification;
- compatibility evidence.

It should not understand Vue directives, Angular decorators or Svelte compiler details.

## Target / runtime plane

Knows how the desired mobile implementation is produced.

Current/future examples:
- Navirox native runtime through Symbiote;
- Expo/React Native generation path;
- future runtime/target providers.

## Toolchain / product experience

Owns:
- CLI;
- config;
- doctor;
- inspect;
- compat;
- migrate;
- build;
- reports;
- migration state.

---

# 3. High-level architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                       WEB CODEBASE                           │
│ Vue · Nuxt · Svelte · Angular · React · Astro · ...          │
└───────────────────────────┬──────────────────────────────────┘
                            │
                     DetectSource()
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                       SOURCE ADAPTER                         │
│ Detect · Parse · Discover · Normalize facts                 │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                MINIMAL NAVIROX APP GRAPH                    │
│ Routes · Screens · Units · Actions · Data · Capabilities    │
│ Dependencies · Source locations · Confidence                │
└───────────────────────────┬──────────────────────────────────┘
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
       Compatibility   Migration       Reporting
          Engine        Planner
             │              │
             └───────┬──────┘
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                   TARGET STRATEGY                            │
│ runtime path · codegen path · fallback path                 │
└───────────────────────────┬──────────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                   NATIVE MOBILE APP                          │
│                         iOS / Android                        │
└──────────────────────────────────────────────────────────────┘
```

---

# 4. Source adapter contract

The source adapter is the new key abstraction.

Conceptual TypeScript:

```ts
export interface SourceAdapter {
  readonly id: string
  readonly displayName: string
  readonly supportLevel: 'experimental' | 'preview' | 'supported' | 'production'

  detect(ctx: DetectionContext): Promise<DetectionResult>
  inspect(ctx: InspectContext): Promise<SourceInspection>
  buildGraph(ctx: GraphContext): Promise<AppGraphFragment>

  capabilities(): SourceAdapterCapabilities

  migrations?: readonly SourceMigrationProvider[]
}
```

Important:
- a source adapter may use the framework compiler internally;
- a source adapter may use ASTs, compiler APIs, language services, file conventions or runtime metadata;
- these implementation details must not leak into the generic core.

## 4.1 Detection result

```ts
interface DetectionResult {
  matched: boolean
  confidence: number
  framework?: string
  frameworkVersion?: string
  metaFramework?: string
  buildTool?: string
  evidence: DetectionEvidence[]
}
```

## 4.2 Inspection result

```ts
interface SourceInspection {
  source: SourceDescriptor
  routes: DiscoveredRoute[]
  units: DiscoveredUnit[]
  dependencies: SourceDependency[]
  platformCapabilities: PlatformCapabilityUse[]
  stateSystems: StateSystem[]
  stylingSystems: StylingSystem[]
  findings: Finding[]
  unknowns: UnknownFinding[]
}
```

---

# 5. Minimal App Graph

The App Graph is not a universal framework AST.

It is a migration decision model.

## 5.1 Required primitives

Start with:

```ts
interface AppGraph {
  app: AppNode
  routes: RouteNode[]
  screens: ScreenNode[]
  units: UnitNode[]
  actions: ActionNode[]
  data: DataNode[]
  capabilities: CapabilityNode[]
  dependencies: DependencyNode[]
  edges: GraphEdge[]
  findings: Finding[]
}
```

## 5.2 Unit types

Keep small:

```text
screen
component
layout
state-module
data-client
domain-module
utility
asset
unknown
```

Do not add framework constructs such as:
- directive;
- decorator;
- hook;
- signal;
- store syntax;
- template compiler node;

unless they are retained as adapter-local metadata.

## 5.3 Source location

Every node should keep traceability:

```ts
interface SourceLocation {
  file: string
  start?: Position
  end?: Position
  adapterId: string
}
```

No generated decision should become impossible to trace back to source.

---

# 6. Migration classification

Canonical enum:

```ts
type MigrationClass =
  | 'shared'
  | 'portable'
  | 'adaptable'
  | 'native-replacement'
  | 'web-fallback'
  | 'manual'
  | 'unknown'
```

Every classification carries:

```ts
interface MigrationDecision {
  classification: MigrationClass
  confidence: 'low' | 'medium' | 'high'
  reasons: Reason[]
  evidence: Evidence[]
  suggestedTarget?: TargetMapping
  blockers?: Blocker[]
}
```

No class without reason/evidence.

---

# 7. Compatibility model

Compatibility is multidimensional.

A compatibility record may depend on:

```text
source framework
source framework version
package
package version
target strategy
runtime provider
native platform
React Native version
native module provider
known build evidence
```

Canonical states:

```text
supported
supported-with-adapter
partial
blocked
unknown
not-applicable
```

## 7.1 Evidence levels

```text
documented
fixture-tested
unit-tested
integration-tested
ios-build-tested
android-build-tested
production-reported
```

A compatibility claim should include its evidence level.

---

# 8. Target strategy

Do not collapse "target" and "runtime" into one concept.

A target strategy describes how source knowledge becomes mobile code.

Examples:

```text
runtime-native
generated-expo
hybrid-transition
manual-native
```

A runtime provider describes what executes the application.

Examples:

```text
symbiote
react-native
expo-based
future
```

The exact implementation can evolve.

## 8.1 Target contract

Conceptually:

```ts
export interface TargetProvider {
  readonly id: string

  assess(graph: AppGraph, ctx: TargetContext): Promise<TargetAssessment>
  plan(graph: AppGraph, ctx: TargetContext): Promise<MigrationPlan>

  generate?(
    graph: AppGraph,
    plan: MigrationPlan,
    ctx: GenerateContext
  ): Promise<GeneratedArtifact[]>
}
```

The target is not required to be codegen-based.

---

# 9. Preserve the existing runtime seam

Current valuable pattern:

```text
@navirox/ui
@navirox/native
@navirox/router
        ↓
@navirox/runtime
        ↓
@navirox/runtime-symbiote
        ↓
Symbiote
```

Keep it.

Do not push source-framework knowledge into `@navirox/runtime`.

Runtime contracts should stay concerned with mobile execution capabilities.

---

# 10. New source seam

Recommended shape:

```text
packages/
  source/
    core/            or @navirox/source
    vue/
    nuxt/
    svelte/          later
    sveltekit/       later
    angular/         later
```

Package naming may be flattened for publishing:

```text
@navirox/source
@navirox/source-vue
@navirox/source-nuxt
@navirox/source-svelte
@navirox/source-angular
```

Do not rename working packages merely to achieve a pretty directory tree. Introduce the seam first.

---

# 11. Current package evolution

## `@navirox/runtime`

Keep.
Role:
- runtime contracts;
- provider registry;
- native execution abstractions.

## `@navirox/runtime-symbiote`

Keep.
Role:
- only Symbiote edge;
- current runtime provider.

## `@navirox/ui`

Keep.
Role:
- stable target/native UI surface;
- no source-framework compiler knowledge.

## `@navirox/native`

Keep.
Role:
- stable native capability surface.

## `@navirox/router`

Keep, but separate:
- target navigation API;
- source-route discovery belongs in source adapters.

## `@navirox/metro-preset`

Short term: keep as current Vue build integration.

Long term:
- either becomes explicitly Vue/runtime-specific;
- or is consumed by `@navirox/source-vue` / runtime tooling.

Do not generalize Metro itself into the source seam.

## `@navirox/inspect`

Promote into a generic orchestrator:
- select source adapter;
- collect source inspection;
- build graph;
- call compat;
- call migration planner;
- render report.

## `@navirox/migrate`

Promote into generic migration orchestrator:
- source-specific transforms from adapter;
- generic extraction transforms;
- target transforms from target provider;
- migration state tracking.

## `@navirox/compat`

Promote into source-neutral compatibility engine.

## `@navirox/doctor`

Keep source-neutral where possible.
May call source adapters for source-specific diagnostics.

## `@navirox/build`

Target-provider orchestrator.
Must not assume EAS or Symbiote identity.

## `@navirox/config`

Expand carefully.

Example:

```ts
export default defineNaviroxConfig({
  source: {
    adapter: 'vue'
  },

  target: {
    provider: 'native'
  },

  runtime: {
    provider: 'symbiote'
  }
})
```

Most users should rely on auto-detection rather than write this manually.

---

# 12. Vue becomes an adapter

Today, Vue is embedded in several assumptions.

Target state:

```text
Vue-specific detection
Vue SFC parsing
Vue template semantics
Pinia discovery
Vue Router/Nuxt route discovery
Vue composable analysis
Vue browser API patterns
        ↓
@navirox/source-vue
```

Nuxt-specific knowledge:

```text
pages/
layouts/
plugins/
server/
useFetch
useAsyncData
Nuxt auto-imports
runtime config
        ↓
@navirox/source-nuxt
```

The Nuxt adapter can compose the Vue adapter.

---

# 13. Svelte proof

The Svelte adapter should initially do only enough to prove the architecture:

1. detect Svelte/SvelteKit;
2. discover routes for one known SvelteKit version range;
3. discover source components;
4. identify imports/dependencies;
5. find common browser APIs;
6. normalize simple actions;
7. classify simple modules;
8. produce the same report schema as Vue.

It does not need:
- full code generation;
- every Svelte compiler feature;
- production support.

### Success test

Given equivalent small Vue and Svelte applications, `navirox inspect` should emit structurally comparable migration reports.

---

# 14. Angular expansion

Angular is intentionally later because it will stress:

- templates;
- standalone components/modules;
- DI;
- services;
- RxJS;
- signals;
- forms;
- Angular Router;
- Angular Material;
- build/AOT behavior.

Angular should validate enterprise-level adapter extensibility, not serve as the first experiment.

---

# 15. Astro as a meta-adapter

Astro is special.

An Astro source adapter may need to:
- parse `.astro` files;
- identify static regions;
- identify islands;
- identify island framework;
- delegate island analysis.

Example:

```text
Astro page
 ├── static content
 ├── Vue island    → source-vue
 ├── Svelte island → source-svelte
 └── React island  → source-react
```

This is a later architecture test for adapter composition.

---

# 16. Migration planner

Planner input:
- App Graph;
- compatibility facts;
- selected target provider;
- project policy.

Planner output:

```ts
interface MigrationPlan {
  source: SourceDescriptor
  target: TargetDescriptor

  phases: MigrationPhase[]
  decisions: MigrationDecision[]
  blockers: Blocker[]
  unknowns: UnknownFinding[]

  summary: {
    shared: number
    portable: number
    adaptable: number
    nativeReplacement: number
    webFallback: number
    manual: number
    unknown: number
  }
}
```

The planner should be deterministic before it becomes AI-assisted.

AI can later:
- explain;
- propose;
- rank options;
- draft target code.

AI should not be the only source of truth for compatibility.

---

# 17. Migration state

Large migrations need state.

Recommended file:

```text
.navirox/migration.json
```

Possible content:

```json
{
  "version": 1,
  "sourceAdapter": "vue",
  "targetProvider": "native",
  "units": {
    "src/pages/profile.vue": {
      "status": "adapted",
      "target": "mobile/app/profile",
      "decisions": ["..."]
    }
  }
}
```

Purpose:
- idempotency;
- incremental work;
- human overrides;
- migration history.

---

# 18. Human overrides

Users must be able to override classifications.

Example config:

```ts
export default defineNaviroxConfig({
  overrides: [
    {
      match: 'src/editor/**',
      classification: 'web-fallback',
      reason: 'temporary migration strategy'
    }
  ]
})
```

Overrides are explicit data, never hidden prompts.

---

# 19. AI role

AI is useful for:
- explaining migration blockers;
- generating target scaffolds;
- proposing equivalent native libraries;
- interpreting ambiguous UI;
- writing manual migration TODOs;
- creating project-specific migration plans.

AI must not replace:
- deterministic project detection;
- known compatibility facts;
- compiler/AST extraction when available;
- build evidence;
- version checks.

Preferred pattern:

```text
deterministic analysis
        +
compatibility evidence
        +
optional AI reasoning
```

not:

```text
send repository to LLM and hope
```

---

# 20. CLI target experience

```bash
navirox inspect
navirox inspect --report json
navirox inspect --framework vue
navirox migrate
navirox migrate --unit src/pages/profile.vue
navirox doctor
navirox compat <package>
navirox dev
navirox build ios
navirox build android
```

Future:

```bash
navirox plan
navirox diff
navirox explain <finding-id>
navirox adapters
```

---

# 21. Report model

Human report should answer:

1. What is this project?
2. What did Navirox understand?
3. What can be reused?
4. What can be migrated automatically?
5. What needs adaptation?
6. What needs native replacement?
7. What is unknown?
8. What should the team do next?

Machine report should be versioned JSON.

Example:

```json
{
  "schemaVersion": "1",
  "source": {"adapter": "vue", "version": "3.x"},
  "summary": {
    "shared": 18,
    "portable": 42,
    "adaptable": 14,
    "nativeReplacement": 3,
    "manual": 2,
    "unknown": 5
  },
  "findings": []
}
```

---

# 22. Testing strategy

## Contract tests

Every source adapter runs the same contract suite.

Examples:
- detection has evidence;
- paths are normalized;
- source locations are valid;
- unknown syntax does not crash core;
- all graph nodes have stable ids;
- classifications have reason/evidence.

## Fixture tests

Each adapter owns fixtures:
- minimal;
- realistic;
- unsupported syntax;
- version edge cases.

## Cross-adapter golden tests

Equivalent example applications should normalize into comparable semantic facts.

## Runtime tests

Keep current runtime boundary tests.

## End-to-end tests

At least:
- Vue acceptance app;
- later Svelte inspection acceptance;
- build/runtime acceptance for supported target.

---

# 23. Security and privacy

For local analysis:
- prefer local file analysis;
- do not require source upload.

For future hosted analysis:
- explicit opt-in;
- repo access scopes minimized;
- never train on private code without explicit policy/consent;
- secrets detection before upload;
- redact environment values;
- auditable retention controls.

---

# 24. Product moat

Long-term defensibility comes from:

```text
adapter knowledge
migration corpus
compatibility registry
version evidence
native mappings
codemods
CI matrix
migration-state model
real production migrations
developer trust
```

Not from one renderer or one framework.

---

# 25. Blueprint north star

```text
Any mature web app
        ↓
Navirox understands it
        ↓
Navirox gives a truthful native migration model
        ↓
Navirox automates safe work
        ↓
Navirox guides the unsafe/ambiguous work
        ↓
A maintainable native app emerges incrementally
```
