# ARCHITECTURE — Navirox Repositioned

**Status:** Target architecture for incremental migration of the existing repository  
**Non-goal:** No big-bang rewrite.

---

# 1. Architectural invariants

These rules are stricter than package layout aesthetics.

## A1 — Source-framework isolation

No framework-neutral core package may import:
- Vue;
- Nuxt;
- Svelte;
- Angular;
- React;
- Astro framework/compiler packages.

Framework imports belong in `source-*` adapters.

## A2 — Runtime-provider isolation

Keep the existing rule:
- only the runtime provider package may import the concrete renderer/runtime implementation where the existing boundary requires it.

## A3 — Product APIs are Navirox APIs

Do not expose provider-specific types through public Navirox APIs unless explicitly marked as an integration escape hatch.

## A4 — No giant IR

The shared App Graph contains only semantics needed by:
- inspection;
- compatibility;
- migration planning;
- target generation/orchestration.

## A5 — Traceability

Every graph fact and migration decision should be traceable to:
- source file;
- adapter;
- evidence;
- version where relevant.

## A6 — Unknown is valid

Unknown syntax/dependency/capability must not be converted into a fake success.

## A7 — Current behavior before elegance

During the repositioning, preserving working Vue behavior is more important than perfect package naming.

---

# 2. Existing architecture to preserve

The repository already contains a useful runtime boundary.

```text
App
 ↓
@memolabs-apps/ui / native / router
 ↓
@memolabs-apps/runtime
 ↓
@memolabs-apps/runtime-symbiote
 ↓
Symbiote / native host
```

This remains.

The repositioning adds a parallel upstream architecture:

```text
Project files
 ↓
@memolabs-apps/source
 ↓
@memolabs-apps/source-vue
 ↓
@memolabs-apps/inspect / migrate / compat
```

Later:

```text
@memolabs-apps/source-svelte
@memolabs-apps/source-angular
...
```

---

# 3. Layer model

```text
L0  User web source
L1  Source adapters
L2  App Graph / analysis core
L3  Compatibility + migration planning
L4  Target providers
L5  Navirox runtime/public mobile APIs
L6  Concrete runtime provider
L7  Native infrastructure/platform
```

Tooling spans L1–L4:
- CLI
- config
- doctor
- inspect
- migrate
- build
- reporting

---

# 4. Recommended package map

This is a target map, not an instruction to rename everything immediately.

```text
packages/
  source/
    core/
    vue/
    nuxt/
    svelte/        # later
    sveltekit/     # later
    angular/       # later

  graph/
  planner/

  compat/
  inspect/
  migrate/
  doctor/
  config/
  cli/
  build/

  target/
    core/
    native/
    expo/          # only when proven/useful

  runtime/
  runtime-symbiote/

  ui/
  native/
  router/

  metro-preset/   # existing; treat as implementation-specific
  create-navirox/
```

Publishing can use flat names:
- `@memolabs-apps/source`
- `@memolabs-apps/source-vue`
- `@memolabs-apps/graph`
- `@memolabs-apps/planner`
- etc.

---

# 5. Source adapter SDK

```ts
export interface SourceAdapter {
  id: string
  displayName: string
  supportLevel: SupportLevel

  detect(ctx: DetectionContext): Promise<DetectionResult>

  inspect(ctx: InspectContext): Promise<SourceInspection>

  buildGraph(
    inspection: SourceInspection,
    ctx: GraphContext
  ): Promise<AppGraphFragment>

  getMigrations?(): readonly SourceMigrationProvider[]
}
```

## 5.1 Design rule

`SourceAdapter` is semantic, not parser-specific.

Do not add methods such as:

```ts
parseSfc()
compileTemplate()
resolveDecorator()
```

Those belong inside implementations.

---

# 6. Adapter registry

Core should discover adapters through a registry.

```ts
interface SourceAdapterRegistry {
  register(adapter: SourceAdapter): void
  list(): readonly SourceAdapter[]
  detect(ctx: DetectionContext): Promise<DetectedSource[]>
  get(id: string): SourceAdapter
}
```

Detection may return multiple candidates.

Example:
- Nuxt project matches Nuxt and Vue.
- SvelteKit matches SvelteKit and Svelte.

Selection rule:
- prefer most specific meta-framework adapter;
- meta-framework may compose base adapter.

---

# 7. App Graph identifiers

Stable ids matter for incremental migration.

Recommended pattern:

```text
<adapter-id>:<normalized-file-path>:<semantic-kind>:<local-key>
```

Example:

```text
vue:src/pages/profile.vue:screen:default
```

Do not use random UUIDs for source-derived nodes unless no stable identity exists.

---

# 8. App Graph schema

Initial schema:

```ts
export interface AppGraph {
  schemaVersion: 1

  source: SourceDescriptor

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

## 8.1 `RouteNode`

```ts
interface RouteNode {
  id: NodeId
  pathPattern: string
  screenId?: NodeId
  params?: RouteParam[]
  source: SourceLocation
  metadata?: Record<string, unknown>
}
```

## 8.2 `ScreenNode`

```ts
interface ScreenNode {
  id: NodeId
  name?: string
  unitId: NodeId
  routeIds: NodeId[]
  source: SourceLocation
}
```

## 8.3 `UnitNode`

```ts
interface UnitNode {
  id: NodeId
  kind:
    | 'screen'
    | 'component'
    | 'layout'
    | 'state-module'
    | 'data-client'
    | 'domain-module'
    | 'utility'
    | 'asset'
    | 'unknown'

  source: SourceLocation
  dependencies: NodeId[]
  metadata?: Record<string, unknown>
}
```

## 8.4 `CapabilityNode`

Represents platform/browser capability usage.

Examples:
- local storage;
- geolocation;
- camera;
- file picker;
- push;
- clipboard;
- share;
- URL navigation;
- browser DOM;
- canvas;
- drag/drop.

```ts
interface CapabilityNode {
  id: NodeId
  capability: string
  usage: 'read' | 'write' | 'invoke' | 'render' | 'unknown'
  source: SourceLocation
}
```

---

# 9. Findings and evidence

```ts
interface Finding {
  id: string
  code: string
  severity: 'info' | 'warning' | 'error'
  title: string
  message: string
  evidence: Evidence[]
  source?: SourceLocation
}
```

```ts
interface Evidence {
  kind:
    | 'source'
    | 'manifest'
    | 'compiler'
    | 'compat-registry'
    | 'build'
    | 'fixture'
    | 'user-override'

  value: string
}
```

This model supports truthful reports.

---

# 10. Migration planner architecture

```text
App Graph
   +
Compatibility Registry
   +
Target Provider
   +
User Overrides
   ↓
Rules
   ↓
Migration Decisions
   ↓
Migration Plan
```

Initial planner should be rule-driven.

Example rules:

```text
pure TS domain module
  → shared

localStorage usage
  → adaptable
  → mapping: storage capability

DOM canvas visualization
  → native-replacement or web-fallback

unknown package with DOM peer dependency
  → unknown/manual
```

AI explanations can be added around rule output.

---

# 11. Rule engine

Avoid a magical global switch statement.

Conceptually:

```ts
interface MigrationRule {
  id: string
  applies(ctx: RuleContext): boolean
  evaluate(ctx: RuleContext): MigrationDecision | null
}
```

Rules may come from:
- core;
- source adapter;
- target provider;
- compatibility registry.

Precedence:
1. user override;
2. blocking known incompatibility;
3. target-specific rule;
4. source-specific rule;
5. generic rule;
6. unknown.

---

# 12. Compatibility registry architecture

Registry record:

```ts
interface CompatibilityRecord {
  subject: CompatibilitySubject
  constraints: CompatibilityConstraints
  status: CompatibilityStatus
  mappings?: TargetMapping[]
  evidence: CompatibilityEvidence[]
  notes?: string[]
}
```

Compatibility subjects may include:
- npm package;
- source capability;
- source framework feature;
- target capability;
- runtime/native module.

Do not model the registry as only npm packages.

---

# 13. Target providers

Target providers answer:

- can this graph be implemented?
- what strategy should be used?
- what dependencies/capabilities are required?
- what files can be generated?
- what runtime/build backend is needed?

```ts
interface TargetProvider {
  id: string
  assess(...): Promise<TargetAssessment>
  plan(...): Promise<TargetPlan>
  generate?(...): Promise<GeneratedArtifact[]>
}
```

A provider may choose:
- current Navirox runtime;
- Expo/React Native code generation;
- mixed migration strategy.

---

# 14. Runtime and target are different

Important distinction:

```text
SOURCE
  ↓
MIGRATION TARGET STRATEGY
  ↓
RUNTIME PROVIDER
  ↓
NATIVE PLATFORM
```

Example:

```text
Vue web
  ↓
runtime-native target
  ↓
runtime-symbiote
  ↓
React Native Fabric
```

Future example:

```text
Angular web
  ↓
generated-expo target
  ↓
Expo / React Native
```

Navirox may support multiple strategies without redefining itself.

---

# 15. Config evolution

Current config should be extended, not replaced.

Target:

```ts
import { defineNaviroxConfig } from '@memolabs-apps/config'

export default defineNaviroxConfig({
  source: {
    adapter: 'auto'
  },

  target: {
    provider: 'native'
  },

  runtime: {
    provider: 'symbiote'
  },

  migration: {
    stateFile: '.navirox/migration.json'
  }
})
```

Later:
- per-path overrides;
- confidence thresholds;
- fallback policy.

---

# 16. `inspect` flow

```text
CLI
 ↓
load config
 ↓
adapter registry
 ↓
detect project
 ↓
select adapter
 ↓
adapter.inspect()
 ↓
adapter.buildGraph()
 ↓
compat.resolve()
 ↓
planner.plan()
 ↓
report renderer
```

Outputs:
- human terminal report;
- JSON report;
- later HTML report.

---

# 17. `migrate` flow

```text
load migration state
 ↓
inspect current source
 ↓
diff against previous graph
 ↓
select migration unit(s)
 ↓
apply source transforms
 ↓
apply generic transforms
 ↓
apply target transforms
 ↓
write target artifacts
 ↓
validate
 ↓
update migration state
```

No migration should depend on the user having run `inspect` manually first; `migrate` can run inspection internally.

---

# 18. Migration transforms

Three families:

## Source transforms
Examples:
- extract pure logic from Vue SFC;
- normalize router usage;
- rewrite source-framework helper into portable module.

## Generic transforms
Examples:
- extract shared TS package;
- create platform abstraction;
- move environment-neutral schema.

## Target transforms
Examples:
- generate native capability adapter;
- generate route;
- generate native screen scaffold.

---

# 19. Build architecture

`@memolabs-apps/build` should call a build provider.

Concept:

```ts
interface BuildProvider {
  id: string
  doctor(ctx): Promise<BuildDiagnostics>
  build(ctx): Promise<BuildResult>
  submit?(ctx): Promise<SubmitResult>
  update?(ctx): Promise<UpdateResult>
}
```

Possible providers:
- raw native / Fastlane;
- future EAS;
- others.

No provider should be assumed in generic code.

---

# 20. Current `metro-preset`

Do not attempt to make Metro universal.

Metro is part of a target/runtime implementation.

The current Vue SFC transform is still valuable for the existing runtime path.

Possible long-term outcome:

```text
@memolabs-apps/metro-preset
  = compatibility alias / runtime build preset

@memolabs-apps/source-vue
  = source analysis adapter
```

Different responsibilities.

---

# 21. Boundary tests to add

Existing runtime boundary tests must remain.

Add source boundary test:

Fail if generic packages import framework packages.

Protected generic packages should include at minimum:
- graph;
- planner;
- compat core;
- inspect core;
- migrate core;
- config;
- build core.

Allowed:
- `source-vue`;
- `source-nuxt`;
- adapter fixtures/examples.

Add target boundary test:
- source adapters must not import target providers.

---

# 22. Adapter contract tests

Every adapter test suite must validate:

```text
[ ] deterministic id
[ ] detection evidence
[ ] normalized paths
[ ] stable graph ids
[ ] source traceability
[ ] unknown construct handling
[ ] no crash on partial project
[ ] no target dependency
[ ] version information when discoverable
```

---

# 23. Version strategy

Adapters should declare tested source version ranges.

Example:

```json
{
  "adapter": "vue",
  "tested": {
    "vue": ["3.5", "3.6"],
    "vite": ["7"]
  }
}
```

Do not imply support for untested majors.

---

# 24. Data schemas

All machine-readable reports and migration-state files must include:
- schema version;
- producer Navirox version;
- adapter id/version;
- timestamp optional but not used for identity.

Schemas need migrations when changed incompatibly.

---

# 25. Error model

Errors should answer:

1. what failed;
2. whether source code is invalid or unsupported;
3. which adapter/provider emitted the error;
4. which file/line caused it;
5. what the user can do.

Avoid provider stack traces as default UX.

---

# 26. AI integration boundary

If AI is added:

```text
Core facts
 ↓
structured prompt
 ↓
AI suggestion
 ↓
validated proposal
```

AI output must be marked as:
- suggestion;
- inferred;
- unverified;

until validated by deterministic checks/builds.

---

# 27. Performance

Inspection must eventually support:
- incremental file hashing;
- adapter-level caches;
- no full compiler work when a manifest-level result is sufficient;
- parallel analysis where deterministic.

Do not optimize before the first two adapters work.

---

# 28. Repository migration strategy

Do not create `packages/source/*` and move every file on day one.

Sequence:

1. add contracts;
2. wrap existing Vue behavior;
3. route `inspect` through adapter;
4. move implementation gradually;
5. add boundary tests;
6. add Svelte proof.

This avoids destroying current evidence.

---

# 29. Architecture definition of done

The repositioned architecture is considered established when:

- generic source adapter contract exists;
- Vue adapter uses it;
- core packages pass "no framework import" boundary test;
- current Vue acceptance path still works;
- generic App Graph schema is versioned;
- generic planner consumes graph;
- Svelte adapter can produce a report through the same pipeline;
- runtime seam remains unchanged or only minimally extended;
- docs match actual behavior.
