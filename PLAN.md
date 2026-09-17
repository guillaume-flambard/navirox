# Navirox — Implementation Plan

**Blueprint:** `blueprint.md` (50 sections, in-repo). **This plan supersedes it where the two disagree** — §2 lists every disagreement and its evidence.

**Canonical principle (must survive every decision):**

> Navirox is the native mobile stack for Vue teams. Symbiote is a runtime provider, React Native/Fabric is infrastructure, and Expo/EAS is an integration — none of them define Navirox's identity.

---

## 0. How to read this plan

- **§2 is the most important section.** It replaces assumptions in the blueprint with verified facts. Read it before trusting any blueprint section.
- Status tags used throughout: `[BUILD-NOW]` `[RESEARCH]` `[OPTIONAL]` `[BLOCKED-UPSTREAM]`.
- Every milestone has a **GO/NO-GO** gate (§14). Nothing downstream starts until its gate passes.
- Tasks in §22 are written to be pasted into GitHub as issues verbatim.
- Placeholder to confirm: **`ORG`** = the GitHub org that hosts `navirox` (assumed `navirox/navirox`).

---

## 1. Executive summary

### The product

Navirox turns an existing Vue/Nuxt team into a team that ships real native iOS + Android apps **without changing stack**. It is a *product layer*, not a renderer: create, develop, inspect, migrate, doctor, ship.

### The single most important finding

**Symbiote is not a thin renderer — it is already a Vue-native app framework.** It ships intrinsic `view`/`text`/`pressable` tags, SFC `<style scoped>` → native style compilation, CSS/SCSS/Less/Stylus modules, `v-model`, `v-show`, `Teleport`, `createTunnel`, `AppRegistry`, `Animated`/`PanResponder`, a native Stack + JS Tab/Drawer navigation package, and ~28 native module wrappers (haptics, secure store, sensors, local auth, network, battery, …), all MIT.

Therefore any plan that has Navirox *build* components, styling, navigation, or native APIs from scratch is a plan to lose: it duplicates a fast-moving upstream and delivers nothing a Vue team couldn't already get. Any plan that has Navirox merely re-export Symbiote is a plan to become worthless the moment Symbiote publishes its own scaffolder.

### The resolved strategy

Navirox owns **the team-and-product layer**, thin curated façades at the two surfaces users touch, and a **replaceable runtime seam**:

| Layer | Owned by Navirox? | Why |
|---|---|---|
| Scaffolding (`create-navirox`) | **Yes, fully** | Doesn't exist upstream; is the entry point and the brand |
| Project config + Metro/Babel preset | **Yes, fully** | The integration glue; upstream has none packaged |
| `doctor` / compatibility registry / CI matrix | **Yes, fully** | The declared moat; purely Navirox knowledge |
| `inspect` / `migrate` (Nuxt + Vue) | **Yes, fully** | Highest-durability asset; upstream will never build it |
| Shared-code model + conventions + docs | **Yes, fully** | The reason a Vue team picks us |
| `@navirox/runtime` seam + `@navirox/runtime-symbiote` | **Yes (thin)** | The replaceability contract; §5.2 |
| `@navirox/ui` / `@navirox/native` / `@navirox/router` | **Yes (façade only)** | API stability + a place to add Vue-first sugar; §4 |
| Renderer, components, styles, native modules | **No — consume** | Symbiote's job; forking it is explicitly a non-goal |

### What this plan delivers

1. A **7-day feasibility sprint** producing Proofs A/B/C with explicit GO/NO-GO gates (§8).
2. An **experimental Expo/EAS verdict** — prove or kill, do not assume (§9). Current expectation: **EAS Build/Update/Submit are BLOCKED-UPSTREAM.**
3. A **task-level MVP 0.1** plan (§10) and a **0.1 → 1.0 roadmap** with exit criteria (§11).
4. A **risk register** (§13) whose #1 entry is Symbiote's beta/churn/bus-factor.
5. **Exact first GitHub issues** (§22) and a **definition of done per milestone** (§23).

### Honest assessment of the premise

Navirox is viable **if and only if** the Vue team's pain is *the whole journey* (scaffold, wire, know what's compatible, migrate existing Nuxt code, ship) rather than *the renderer*. If Symbiote later ships a scaffolder + docs site, Navirox's defensible remainder is: **migration intelligence, compatibility guarantees, shared-code model, and DX.** That remainder is what this plan builds first — deliberately.

---

## 2. Blueprint vs. verified reality

Every row is a place where the blueprint is wrong, obsolete, or unproven. **Evidence is cited.**

| # | Blueprint says | Verified reality | Plan consequence |
|---|---|---|---|
| 1 | §29 `npm create <name>` scaffolds — MVP DoD | No published scaffolder exists. Symbiote docs: *"The quickest way to try it today is to run one of the repository examples instead of starting from a published scaffolder."* | Scaffolder is **Navirox's first real deliverable**, not a wrapper. §8 Day 6, §22 NX-006. |
| 2 | §15/§26 Expo Dev Client + EAS Build/Update/Submit is the V1 ship backend | Symbiote docs: *"SymbioteNative apps never install the `expo` meta-package — it bundles its own Metro config and Babel preset, which collide with this project's own bundler pipeline (Vue SFC transform, Angular AOT linker, the CSS-parser transform)."* | **EAS is not a V1 backend.** Demote to `[RESEARCH]` with a hard experiment. §9. Ship V1 = Xcode/Gradle + Fastlane. |
| 3 | §18 "initially re-exports" for View/Text/Pressable | `view`, `text`, `pressable`, `text-input`, `scroll-view` are **intrinsic tags — no import at all**. Only list components (`FlatList`, `SectionList`, …) are imported. | `@navirox/ui` cannot "re-export" primitives. It becomes a **types + conventions + sugar** package. §4, §5.9. |
| 4 | §16/§17 Navirox builds routing (`app/` file-based, `<Stack><Slot /></Stack>`) | `@symbiote-native/navigation` already ships native Stack (via `react-native-screens`) + JS Tab/Drawer, with explicit verbs (`push`/`pop`/`replace`/`reset`), hooks/composables, and linking. **No `navigate()`.** | Navirox adds **file-based routing + typed params** *on top*, not navigators. This fills the real gap: *"Route `params` are `unknown` in this v1."* §5.6. |
| 5 | §19 V2 class-based styling "ideally UnoCSS" | `@symbiote-native/css-parser` already compiles plain CSS, CSS Modules, **SCSS/Sass, Less, Stylus**, with `css-dts` codegen and a `typescript-plugin`. **Tailwind is the open seam.** | Styling is **solved**. Navirox documents it and adds Tailwind/Uno later as `[OPTIONAL]`. §11 (0.3). |
| 6 | §15/§21 Navirox owns "native API + provider model" (`useCamera`, `useLocation`) | ~28 `expo-modules-core` wrappers already exist (haptics, sensors, secure store, local auth, network, battery, device, crypto, sharing, sms, …) via `@symbiote-native/*`. | `@navirox/native` is a **curated, versioned façade** + provider abstraction, not an implementation. §5.7. |
| 7 | §12 compatibility registry is a nice-to-have moat | npm versions are **uncoordinated and fast-moving**: `@symbiote-native/vue` **2.0.0**, `navigation` **4.0.1**, `engine` **0.5.0**, all published within days of each other. | Registry + CI matrix move **earlier** — they are load-bearing, not polish. §18. |
| 8 | §13 CI matrix across Vue × runtime × RN × Expo SDK | `@symbiote-native/engine` peer is **`react-native >=0.86`**; New Architecture is **mandatory** (no legacy fallback — it talks to `global.nativeFabricUIManager`). | Matrix axes are real but **narrower than assumed** (no legacy RN, no Expo SDK axis until §9 proves it). §18. |
| 9 | §44 anti-fork: "50 adapters hard" | Upstream's own **non-goals**: no RN native forking, no hiding `react-native`, **no making third-party RN JS components framework-agnostic**, no replacing Yoga/Fabric. | Anti-fork strategy becomes **integration + workflow intelligence**, not adapter volume. §15. |
| 10 | §14 "Don't expose provider complexity" | Provider reality is worse than a doc problem: Expo modules need **hand-reproduced Podfile Ruby subclassing, `settings.gradle` `includeBuild`, `MainApplication.kt` generated regions, `xcodeproj` file references (via the `xcodeproj` gem), an iOS 16.4 deployment-target bump, and `Info.plist` keys.** | This plumbing **is** a Navirox product surface (`navirox add <module>`). Highest-value near-term brick. §5.7, §11 (0.2). |
| 11 | §46 Day 1 "repo + App.vue → iOS" | Symbiote quick start requires **Node >=20, pnpm 11.x**; local machine has **pnpm 12.4.1**, **no `watchman`**, **no `adb` on PATH**. | Sprint Day 0 includes toolchain reconciliation. §8. |
| 12 | §25 Vue DevTools for native — "big differentiator" | Not mentioned anywhere in Symbiote docs; no existing hook. | `[RESEARCH]`, explicitly de-risked later. Not in MVP 0.1. |
| 13 | §39 "MIT/Apache TBD after dependency review" | Repo **and** all inspected packages are **MIT**. | Use **MIT**. Still run a dependency-license audit (§13 R-09). |
| 14 | §41 moat = brand/community/registry | Repo is **beta, 65 stars, 1 fork, 12 open issues, single author (`OneEyed1366`), first commit 2026-06-20**. | Bus-factor risk is **severe**. It is the top of the risk register and shapes the seam design. §13 R-01/R-02. |
| 15 | §27 "Symbiote becomes a Runtime Provider" | Symbiote is **framework-agnostic by design** (5 adapters, shared core). It is not positioning as a Vue product, and its roadmap targets **full Expo SDK parity**. | The anti-Symbiote test must be re-run continuously: everything Symbiote's roadmap covers will be absorbed. §15. |

---

## 3. Product boundaries

### What Navirox IS

1. **A scaffolder** — `npm create navirox` produces a native, runnable Vue app with zero manual native plumbing.
2. **A project system** — `navirox.config.ts`, a Metro/Babel preset, TS config, and conventions.
3. **A compatibility authority** — a registry + CI matrix + `navirox doctor` that tells a Vue team, truthfully, what works.
4. **A migration engine** — `navirox inspect` and `navirox migrate` for existing Vue/Nuxt codebases.
5. **A stable public API surface** — `@navirox/ui`, `@navirox/native`, `@navirox/router` versioned on *Navirox's* schedule, decoupled from Symbiote's churn.
6. **A shared-code doctrine** — the three-category model (shared / adaptable / platform-specific) with tooling that enforces it.

### What Navirox IS NOT (non-goals — record these in the README)

1. **Not a renderer.** Navirox will never implement a Fabric bridge.
2. **Not a fork of React Native, Fabric, Yoga, Hermes, or Symbiote.**
3. **Not a WebView/Capacitor-class runtime.** Native UI only — that is the whole point vs. Capacitor.
4. **Not a promise that 100% of Nuxt code runs natively.** Explicitly forbidden by the blueprint (§44) and now by fact (#9 above).
5. **Not a re-implementation of Expo.** It integrates `expo-modules-core` packages where proven.
6. **Not a component library.** Components are Symbiote's; Navirox curates, types, and versions the *surface*.
7. **Not a React Native component compatibility layer.** Upstream's own non-goal: third-party RN JS components that call React hooks cannot be rendered.

---

## 4. The central architectural decision (read this before §5)

**DECISION REQUIRED — recommendation below. This is the one assumption in the plan that materially changes package layout, so it is called out rather than buried.**

Given §2 Finding #1 (Symbiote already ships components, styles, navigation, native modules), how deep should Navirox's façades be?

### Option A — Pure façade (thin re-export)

`@navirox/ui` re-exports Symbiote's tags/components; `@navirox/native` re-exports the wrappers.

- **Pro:** near-zero maintenance; instant breadth.
- **Con:** fails the blueprint's own anti-Symbiote test — useless if Symbiote ships a scaffolder; adds no durable value; **cannot** deliver "replace Symbiote later" because there is nothing to replace *with*.
- **Verdict: reject as the whole strategy.**

### Option B — Owning implementation (Navirox builds components, routing, native APIs)

- **Pro:** true independence; complete control.
- **Con:** duplicates a 5-framework, ~28-package, actively-shipping upstream; unwinnable with any realistic budget; violates non-goals #1/#2 in spirit.
- **Verdict: reject.**

### Option C — Thin curated façade + owned non-renderer core ⭐ RECOMMENDED

- **Non-renderer core is owned outright**: `create-navirox`, `@navirox/config`, `@navirox/metro-preset`, `@navirox/doctor`, `@navirox/compat`, `@navirox/inspect`, `@navirox/migrate`, `@navirox/cli`. **None of these import Symbiote.** They are Symbiote-independent by construction, which is what actually delivers replaceability.
- **Renderer-touching surface is a curated façade**, in exactly one package allowed to import Symbiote: `@navirox/runtime-symbiote`. `@navirox/ui` / `native` / `router` sit **above** the seam and import only `@navirox/runtime`.
- **Replaceability is real, not rhetorical:** swapping Symbiote means writing one new `runtime-*` package. Contract tests (§19) prove the seam.
- **Vue-first sugar is where Navirox adds genuine, non-duplicative value**: typed route params (Symbiote's are `unknown`), file-based routing, `v-model`-consistent native composables, project-wide conventions.
- **Con:** the façade must be maintained against churn — which is *exactly the work the compatibility registry already does*, so the two reinforce each other.
- **Verdict: recommended.**

**If you disagree, change the depth of `@navirox/ui|native|router` in §5.6/§5.7/§5.9 — the rest of the plan (core, sprint, gates, roadmap, risks) is unaffected.**

---

## 5. Full architecture

### 5.1 Layer model

```
┌──────────────────────────────────────────────────────────────────────┐
│ L0  Vue/Nuxt application code                                        │
│     .vue SFC · <script setup> · Pinia · TS                           │
│     imports: @navirox/ui · @navirox/native · @navirox/router         │
└───────────────┬──────────────────────────────────────────────────────┘
                │  (the ONLY imports app code needs)
┌───────────────▼──────────────────────────────────────────────────────┐
│ L1  Navirox public façades           [owned · thin · versioned]      │
│     @navirox/ui · @navirox/native · @navirox/router                  │
└───────────────┬──────────────────────────────────────────────────────┘
┌───────────────▼──────────────────────────────────────────────────────┐
│ L2  @navirox/runtime   — the replaceable seam   [owned · tiny]       │
│     NativeRuntime interface + host-component & native-module registry │
└───────────────┬──────────────────────────────────────────────────────┘
┌───────────────▼──────────────────────────────────────────────────────┐
│ L3  @navirox/runtime-symbiote        [owned · the ONLY Symbiote edge]│
└───────────────┬──────────────────────────────────────────────────────┘
┌───────────────▼──────────────────────────────────────────────────────┐
│ L4  Symbiote  @symbiote-native/{vue,engine,navigation,css-parser,…}   │
│                [EXTERNAL · MIT · beta · churn risk]                   │
└───────────────┬──────────────────────────────────────────────────────┘
┌───────────────▼──────────────────────────────────────────────────────┐
│ L5  React Native Fabric / JSI / Yoga / Hermes  [EXTERNAL · infra]     │
└───────────────┬──────────────────────────────────────────────────────┘
┌───────────────▼──────────────────────────────────────────────────────┐
│ L6  iOS · Android native hosts                                        │
└──────────────────────────────────────────────────────────────────────┘

Toolchain plane (never imports L2–L6):
  @navirox/cli · @navirox/config · @navirox/metro-preset · @navirox/doctor
  @navirox/compat · @navirox/inspect · @navirox/migrate · create-navirox
```

**Hard rule (lint-enforced, §19):** the toolchain plane must not import Symbiote. Only L3 may.

### 5.2 The NativeRuntime seam

Deliberately small. Every member is something a *different* renderer could plausibly supply.

```ts
// @navirox/runtime — the ONLY contract @navirox/runtime-symbiote must satisfy
export interface NativeRuntime {
  readonly id: string;                 // 'symbiote'
  readonly version: string;

  /** Register + mount the root component; returns an unmount handle. */
  mount(root: Component, options: MountOptions): RuntimeHandle;

  /** Host primitives the app may render (view/text/pressable/…). */
  readonly hostComponents: Readonly<Record<string, HostComponent>>;
  /** Register a custom native view (native-view wrappers, §15). */
  registerNativeComponent(spec: NativeComponentSpec): void;

  /** Native module access — the Expo-module bridge lives behind this. */
  readonly nativeModules: NativeModuleRegistry;

  /** Navigation backend handle (Navirox supplies routing on top). */
  readonly navigation: NavigationBackend;

  /** Runtime-level capabilities, so `doctor` can diff them. */
  readonly capabilities: RuntimeCapabilities;   // { newArch, fabric, platforms[], modules[] }
}

export declare function createRuntime(impl: RuntimeFactory): NativeRuntime;
```

**What this seam buys:**

- `@navirox/ui|native|router` compile against **this**, so they never break when `@symbiote-native/*` ships a major bump (they broke majors twice in three months).
- A second runtime (`runtime-bare`, `runtime-lynx`, a future Vue renderer) is an implementation of this interface only.
- `doctor` reads `capabilities` to diff reality against the registry.

**What this seam must NOT do:** mirror Symbiote's full API. If the interface grows to 200 members it has failed — it becomes Symbiote with extra steps.

### 5.3 Symbiote runtime adapter

One package, `@navirox/runtime-symbiote`, with a `runtime.json` manifest (the same passive-manifest idea upstream uses for native linking):

```json
{
  "id": "symbiote",
  "versionRange": { "@symbiote-native/vue": "^2.0.0", "@symbiote-native/engine": "^0.5.0",
                    "@symbiote-native/navigation": "^4.0.1", "react-native": ">=0.86" },
  "verified": { "ios": true, "android": null },
  "capabilities": { "newArch": true, "fabric": true, "legacyFallback": false },
  "notes": "pin exactly; engine peer requires react-native >=0.86"
}
```

That manifest is consumed by `@navirox/compat` and `navirox doctor` — so the adapter and the registry are the same source of truth.

### 5.4 Expo / RN / Fabric integration boundaries

| Boundary | Status | Rule |
|---|---|---|
| **Fabric / JSI / Yoga / Hermes** | Infrastructure | Never forked, never patched. Version-pinned via `react-native`. |
| **New Architecture** | Hard requirement | `nativeFabricUIManager` only. No legacy path. `doctor` must fail loudly on a legacy config. |
| **`react-native` at app root** | Required | Upstream non-goal: it is never hidden as a transitive dep. |
| **`expo` meta-package** | **Forbidden** | Collides with the Metro/Babel pipeline (Vue SFC + CSS parser). `doctor` must detect and error. |
| **`expo-modules-core` wrappers** | Supported, manually wired | Allowed *only* through the §5.7 provider + generated plumbing. |
| **`expo-modules-autolinking`** | devDependency | Required for the Podfile/Gradle resolution shims. Version-sensitive — pin and record. |
| **EAS Build / Update / Submit · Expo Dev Client** | `[RESEARCH]`, expected `[BLOCKED-UPSTREAM]` | Must be proven by experiment (§9) before any promise. |
| **Third-party RN JS components** | Unsupported | Upstream non-goal. Wrapping the underlying Fabric view is the only path. |
| **`react-native-reanimated`** | Not available yet | Upstream: *"the largest remaining piece and is saved for last."* Use `Animated`. |

### 5.5 CLI architecture

**Shape:** one thin dispatcher (`@navirox/cli`) + one command per package, so a command can be tested and versioned independently.

```
packages/cli/src/
├── bin.ts                 # #!/usr/bin/env node, parses argv, lazy-imports commands
├── commands/
│   ├── dev.ts             # from @navirox/dev
│   ├── doctor.ts          # from @navirox/doctor
│   ├── inspect.ts         # from @navirox/inspect
│   ├── migrate.ts         # from @navirox/migrate
│   ├── build.ts           # from @navirox/build     (ios|android)
│   ├── update.ts          # @navirox/build          (OTA story — §9/§11)
│   ├── submit.ts          # @navirox/build
│   └── add.ts             # @navirox/native         (§5.7 plumbing)
└── lib/                   # shared arg parsing, output formatting, exit codes
```

**Principles:**

- Commands are **lazy-imported** so `navirox doctor` stays fast.
- Every command supports `--json` (agent-readable, and used by CI).
- Exit codes are contractual: `0` ok, `1` user error, `2` environment error, `3` compatibility error.
- No command writes outside the project root without `--force`.

### 5.6 Routing architecture

**Navirox does not build navigators. It supplies the file-based + typed layer Symbiote lacks.**

Symbiote's real gaps (verified): route `params` are **typed `unknown`** — *"there is no per-navigator generic param-list type"*; routes are registered imperatively by name; there is no filesystem convention.

```
app/
├── _layout.vue            → <Stack>/<Tabs>/<Drawer> root
├── index.vue              → { name: 'index', path: '/' }
├── settings.vue           → { name: 'settings', path: '/settings' }
└── profile/
    ├── [id].vue           → { name: 'profile/[id]', params: { id: string } }
    └── _layout.vue
```

Navirox generates a **typed route manifest** at dev/build time and projects it through `@navirox/runtime`:

```ts
// generated: .navirox/routes.d.ts
export interface RouteParams {
  'index': undefined;
  'settings': undefined;
  'profile/[id]': { id: string };
}
// useRouter().push('profile/[id]', { id: '42' })  // ← params type-checked
```

- `@navirox/router` wraps `@symbiote-native/navigation/vue` (pinned), exposing `useRouter()`/`useRoute()`/`useFocusEffect()` **with types**.
- Navirox's explicit verbs mirror upstream (no `navigate()`), so no conceptual translation layer is needed.
- Deep links map from the generated manifest into upstream's linking config — a Navirox generator, not a Navigator.

**Why this is durable:** a typed, filesystem-derived route manifest is Vue/Nuxt-shaped knowledge. It survives a Symbiote version bump and a Symbiote exit.

### 5.7 Native API / provider system

**Provider model** (config surface, stable):

```ts
// navirox.config.ts
export default defineNaviroxConfig({
  runtime: 'symbiote',            // → @navirox/runtime-symbiote
  native: { provider: 'symbiote' },
  platforms: ['ios', 'android'],
});
```

**Curated façade, not an implementation.** `@navirox/native` exposes the providers Navirox has *verified*, with Vue-first signatures, and delegates to Symbiote's wrappers:

| Navirox API | Delegates to | Status |
|---|---|---|
| `useHaptics()` | `@symbiote-native/haptics` | available |
| `useSecureStorage()` | `@symbiote-native/secure-store` | available (+ Android manifest attributes) |
| `useSensors()` | `@symbiote-native/sensors` | available (+ `NSMotionUsageDescription` / `ACTIVITY_RECOGNITION`) |
| `useNetwork()`, `useBattery()`, `useDevice()`, `useClipboard()`, `useSharing()` | `@symbiote-native/*` | available |
| `useLocalAuth()` | `@symbiote-native/local-auth` | available |
| `useCamera()`, `useLocation()`, `useNotifications()` | — | **not available upstream** → `[RESEARCH]`/`[OPTIONAL]`; §11 (0.2) |

**The high-value brick: `navirox add <module>`.** The verified Expo-module wiring is brutal (Podfile Ruby method overrides including an arity change in `expo-modules-autolinking` 57.0.8; `settings.gradle` `includeBuild` driven by the autolinking CLI; root `build.gradle` classpath; `app/build.gradle` + `MainApplication.kt` generated regions via `@symbiote-native/expo-modules-link`; `xcodeproj`-gem file references; an **iOS deployment-target bump to 16.4**; `Info.plist` keys; Android `<application>` attributes). Today that is a doc page a human follows. **Navirox should make it one command** — and be the only place that knowledge lives. This is anti-fork-proof and Symbiote-agnostic in value.

### 5.8 Compatibility registry architecture

```
registry/
└── symbiote/
    └── 2.0.0/
        ├── index.json          # runtime manifest: engine/navigation/vue/RN ranges
        ├── packages/
        │   ├── expo-haptics.json
        │   ├── pinia.json
        │   ├── vueuse.json
        │   └── leaflet.json
        └── matrix.json         # last successful CI matrix run
```

Entry shape:

```json
{
  "package": "pinia",
  "range": ">=2.2 <4",
  "support": "full",
  "adapter": null,
  "tested": { "ios": { "ok": true, "version": "8.0.0" },
              "android": { "ok": null, "version": "14" } },
  "notes": "pure JS — no native surface",
  "evidence": { "test": "compat/pinia.spec.ts", "run": "2026-09-17T10:00:00Z" }
}
```

**Rules that make it trustworthy (and a moat):**

1. **No entry without evidence.** `support` must cite a real test run; `unknown` is a first-class value and the default.
2. The registry is **generated**, not hand-written: the CI matrix writes it, so it cannot rot.
3. `navirox doctor` reads it; `--json` feeds CI.
4. `@navirox/compat` is a **pure data + query package** — no Symbiote import (toolchain plane, §5.1).

### 5.9 Migration tooling architecture

Three stages, each shippable alone:

```
1. DETECT      @navirox/inspect   static analysis, no execution, no network
2. CLASSIFY    @navirox/inspect   shared | adaptable | platform-specific  (blueprint §9)
3. REWRITE     @navirox/migrate   codemods for the safe subset; TODO markers for the rest
```

**Detection targets (blueprint §23, verified as real gaps):** Nuxt, Vue version, Vue Router, Pinia, VueUse, Tailwind, i18n, API clients, **browser-API usage**, DOM-specific components, `window`/`document`, `localStorage`, `navigator.*`, `<input type="file">`, CSS `:hover`.

**Rewrite map (safe subset only):**

| From | To | Auto? |
|---|---|---|
| `localStorage.getItem/setItem` | `useSecureStorage()` / async KV | yes (with TODO on sync semantics) |
| `window.location.*` | `useRouter()` | yes |
| `navigator.geolocation` | `useLocation()` | no — `[RESEARCH]` §5.7 |
| `<input type="file">` | native picker | no — emit TODO |
| Leaflet / map libs | native map | no — emit TODO |
| CSS `:hover` | remove/adapt | yes (report) |
| Vue Router routes | `app/` file tree | partial — emit manifest, human confirms |

**Architecture:** AST-based (use `@vue/compiler-sfc`), never regex. Every codemod is a **fixture-tested pure function** `(source) => { code, todos[] }` (§19). The readiness report is `--json`.

**This is the single highest-durability asset** (§15) — it encodes years of "what breaks when Vue goes native", and no upstream will build it.

### 5.10 Shared-code model

Enforced, not just documented — `navirox doctor` classifies the repo and **fails CI if a shared package imports a platform-only API.**

```
apps/web/     (Nuxt)          ┐
apps/mobile/  (navirox)       ├─ both import ─┐
packages/api/         API client       ✅ shared
packages/types/       TS types         ✅ shared
packages/validation/  schemas          ✅ shared
packages/stores/      Pinia stores     ✅ shared (no browser/native API inside)
packages/business/    pure rules       ✅ shared
packages/ui-native/   native-only      ⚠ platform-specific
```

Rule Navirox teaches and checks: **shared packages may import `vue`, `pinia`, and `zod` — never `window`, never `@navirox/native`.**

### 5.11 Testing / CI / release architecture

Mirrors the only proven approach (Symbiote's own):

| Layer | Tool | Scope |
|---|---|---|
| Unit / integration (renderer) | **Vitest** | Components, route generation, codemods, registry queries — **fake Fabric slot** where needed |
| Tooling suites | **Node built-in test runner** | `*.test.mjs` / `*.test.cjs` for CLIs and build scripts |
| E2E / native | **Detox** | iOS + Android, shared `testID`s |
| Contract tests | Vitest | `@navirox/runtime` seam — proves replaceability |
| Migration fixtures | Vitest | input repo → expected diff + expected TODO list |
| Compatibility | generated CI matrix | writes the registry (§18) |

**Release:** pnpm workspaces + Turborepo + **Changesets**; independent versioning per package; `@navirox/*` published to npm under the same scope as the CLI. Canary channel on every `main` push.

---

## 6. Package layout

```
navirox/
├── package.json                     # pnpm workspaces root
├── pnpm-workspace.yaml
├── turbo.json
├── .changeset/
├── AGENTS.md                        # agent instructions (this repo)
│
├── packages/
│   ├── runtime/                     # @navirox/runtime          — the seam (§5.2)
│   ├── runtime-symbiote/            # @navirox/runtime-symbiote — ONLY Symbiote edge
│   ├── ui/                          # @navirox/ui               — façade + sugar
│   ├── native/                      # @navirox/native           — curated provider façade + `add`
│   ├── router/                      # @navirox/router           — file-based + typed routes
│   ├── config/                      # @navirox/config           — defineNaviroxConfig, schema
│   ├── metro-preset/                # @navirox/metro-preset     — composes SFC + CSS transforms
│   ├── compat/                      # @navirox/compat           — registry schema + queries
│   ├── doctor/                      # @navirox/doctor
│   ├── inspect/                     # @navirox/inspect          — detect + classify
│   ├── migrate/                     # @navirox/migrate          — codemods
│   ├── build/                       # @navirox/build            — ios/android/update/submit
│   ├── cli/                         # @navirox/cli              — `navirox` bin
│   └── create-navirox/              # create-navirox            — `npm create navirox`
│
├── registry/                        # versioned compatibility data (§5.8)
├── templates/                       # create-navirox templates
├── examples/
│   ├── vue-basic/                   # the canary (Proof A)
│   ├── vue-pinia/                   # Proof: stores + HMR
│   ├── vue-native-module/           # Proof C: Expo module
│   └── nuxt-shared-monorepo/        # §5.10 reference
├── docs/                            # documentation site
├── e2e/                             # Detox config + shared testIDs
└── .github/                         # workflows, issue templates, RFC template
```

**Dependency direction (enforced by dep-cruiser, §19):**
`cli → {doctor, inspect, migrate, build, config}` · `{ui, native, router} → runtime` · `runtime-symbiote → runtime, symbiote` · **toolchain ⇏ symbiote**.

---

## 7. Dependency graph

```
create-navirox ──▶ templates
cli ──▶ dev · doctor · inspect · migrate · build · config
                     │        │        │       │
                     ▼        ▼        ▼       ▼
                  compat   compat   compat  runtime-symbiote
                     │        │
                     └────────┴──▶ registry/ (data, versioned)

ui ─────▶ runtime ◀───── router
native ─▶ runtime ◀───── runtime-symbiote ──▶ @symbiote-native/*
                                                        │
                                                        ▼
                                                  react-native
                                                        │
                                                        ▼
                                              Fabric / JSI / Yoga / Hermes
```

**External (pinned, recorded in `runtime-symbiote/runtime.json`):** `@symbiote-native/vue@^2.0.0`, `@symbiote-native/engine@^0.5.0` (peer `react-native >=0.86`), `@symbiote-native/navigation@^4.0.1`, `@symbiote-native/css-parser`, `@symbiote-native/expo-modules-link`, `react-native@>=0.86`, `vue@^3.x`. Dev-only: `expo-modules-autolinking` (**pinned — its Ruby arity changed in 57.0.8**).

---

## 8. Seven-day feasibility sprint (Proofs A/B/C)

**Goal:** produce evidence for the three proofs (blueprint §47) and a running `examples/vue-basic`, with **five GO/NO-GO gates**. Sprint output is `0.0.1` — a working canary + architecture docs + registry seed. **Not** a published scaffolder.

**Proof definitions (acceptance criteria are binary — no partial pass):**

- **Proof A — Native rendering with real Vue DX.** A `.vue` SFC with `<script setup>`, `ref`, `computed`, props/emits, and a Pinia store renders on **iOS and Android** as native Fabric views, with Fast Refresh.
- **Proof B — Navirox owns the surface.** The canary app imports **only** `@navirox/*` (verified by an import scan; zero `@symbiote-native/*` in app code). Swapping `runtime-symbiote` for a stub runtime keeps `@navirox/ui|native|router` compiling.
- **Proof C — Ecosystem breadth is real.** At least one `expo-modules-core`-based native module works on both platforms via `navirox add`, and one **pure-JS** npm Vue package (`pinia`) works unchanged.

### Day 0 — Toolchain reconciliation `[BUILD-NOW]`

- Pin Node (>=20) and **pnpm 11.x** (`packageManager` + corepack). **Local is pnpm 12.4.1 — discrepancy must be resolved and recorded.**
- Install `watchman` (missing) and put `adb` on PATH (`ANDROID_HOME` is set; platform-tools present but not on PATH).
- Verify Fabric/New Arch is on. **Gate G0** below.

### Day 1 — iOS render `[BUILD-NOW]`

Bootstrap the monorepo; clone/study `examples/vue-sfc`; stand up `packages/runtime` + `packages/runtime-symbiote`; render `App.vue` on the iOS simulator (iPhone 17 Pro available). `react-native` pinned at app root; `.vue` Metro transformer wired via `@navirox/metro-preset`.

- **Accept:** native views on iOS sim, hot reload works, no Symbiote import in app code.

### Day 2 — Android + reactivity/events `[BUILD-NOW]`

Android build (`@symbiote-native/android` shims installed for Keyboard/Settings); verify `ref`/`computed`/`v-model`/`@press`/`v-show`; verify list components (`FlatList`) via component import.

- **Accept:** parity check iOS↔Android on the same SFC; reactivity and events demoed.

### Day 3 — The seam (Proof B) `[BUILD-NOW]`

Finalize `NativeRuntime`; move the canary to import **only** `@navirox/*`; add the **import-boundary test** (app code must not import Symbiote) and a **stub-runtime contract test**.

- **Accept:** `pnpm test` proves the seam; app code has zero Symbiote imports.

### Day 4 — Pinia + HMR `[BUILD-NOW]`

`app.use(createPinia())`; a store shared between two screens; HMR across store and SFC edits.

- **Accept:** store state survives a Fast Refresh; HMR does not full-reload.

### Day 5 — Native modules (Proof C) `[BUILD-NOW]`

Wire one `expo-modules-core` wrapper **by hand first** (haptics — the simplest), document every step, then **encode it as the first `navirox add` routine**. Verify on both platforms.

- **Accept:** haptics fire on device/sim; the manual steps are captured as an executable routine, not prose.

### Day 6 — `create-navirox` `[BUILD-NOW]`

Scaffold `my-app/` from a template: `app/`, `components/`, `composables/`, `stores/`, `navirox.config.ts`, `package.json`, `tsconfig.json`, pinned deps. Then `navirox dev` runs it.

- **Accept:** `npm create navirox` on a clean machine → `navirox dev` → app on simulator. **This is the day that decides the product's first impression.**

### Day 7 — Docs + demo + `0.0.1` `[BUILD-NOW]`

Architecture doc (the §5 diagram), README, the split-screen demo (left: SFC edit; right: simulator), and the registry seed from what Days 1–6 actually proved.

- **Accept:** a stranger can follow the README to a running app; the demo is recorded.

### Sprint gates

| Gate | Passes when | On NO-GO |
|---|---|---|
| **G0** Day 0 | Fabric renders an RN canary example on both platforms | Stop. Fix the environment; do not write Navirox code. |
| **G1** Day 1 | SFC → native iOS with hot reload | Fall back: study `examples/vue-sfc` verbatim; if a *verbatim upstream example* fails, the runtime is not viable → **pivot decision** (re-plan against a different runtime, or stop). |
| **G2** Day 2 | Same SFC on Android | Narrow V1 to iOS-only, ship honest `doctor` output; do **not** claim Android. |
| **G3** Day 3 | Seam holds under the stub test | If the seam cannot be made real (Symbiote leaks everywhere), **reclassify Navirox as a façade-by-necessity** and rewrite §4 to Option A, with the honesty cost recorded. |
| **G4** Day 5 | Expo module works on both platforms | Drop §5.7's Expo-module promise to `[BLOCKED-UPSTREAM]`; V1 ships **zero** Expo modules and says so. |
| **G5** Day 6–7 | `create → dev → simulator` on a clean machine | Keep `create` internal for 0.0.x; do not publish a scaffolder that doesn't work everywhere. |

**Sprint-level GO/NO-GO:** all of G0–G5 pass ⇒ proceed to MVP 0.1 (§10). Any hard fail at G1 or G3 ⇒ **architecture pivot review before further spend.**

---

## 9. Expo / EAS feasibility — prove, do not assume

**Current expectation: EAS Build/Update/Submit and Expo Dev Client are `[BLOCKED-UPSTREAM]`.** Evidence: the `expo` meta-package's Metro config + Babel preset *collide* with the Vue SFC and CSS-parser transforms; `expo prebuild` is explicitly not the flow; `expo-modules-autolinking`'s Ruby assumes `expo/bin/autolinking` exists and must be monkey-patched; the Expo Gradle plugin hardcodes `require.resolve('expo/package.json')`. **`expo-modules-core` packages work; the `expo` toolchain does not.**

### Hypotheses to test (each one an experiment with a written result)

| ID | Hypothesis | Method | Kill condition |
|---|---|---|---|
| **E1** | EAS Build can build a Navirox app without the `expo` package | Create an EAS project; attempt build with only `expo-modules-core` + autolinking shims | Any required `expo` dependency in the build graph ⇒ BLOCKED |
| **E2** | Expo Dev Client can run a Navirox app | Attempt `expo-dev-client` install + Metro config merge | Metro preset conflict unresolvable ⇒ BLOCKED |
| **E3** | `expo prebuild` can generate the iOS/Android projects | Run on a navirox app | Overwrites/collides with the SFC + CSS transforms ⇒ BLOCKED |
| **E4** | EAS Update can serve OTA to a Navirox app | Attempt `expo-updates` integration | Needs the `expo` runtime ⇒ BLOCKED |
| **E5** | Expo **Config Plugins** are usable | `expo-modules-autolinking` config-plugin resolution | — |
| **E6** | A non-EAS OTA path exists | Evaluate self-hosted bundles + native hot-swap constraints | — |

### Expected outcome and the shipping backend

If E1–E4 fail (expected), **V1's ship backend is the raw native toolchain**, orchestrated by `@navirox/build`:

- `navirox build ios` → `xcodebuild` (+ `pod install`) · `navirox build android` → `gradlew assembleRelease`
- `navirox submit` → **Fastlane** (`deliver` / `supply`) — no EAS dependency
- `navirox update` → **honest answer**: OTA on a bare RN app requires a JS-bundle-update mechanism Navirox does not yet have. Ship `[BLOCKED-UPSTREAM]` with a documented rationale rather than a broken command.

**This is a deliberate deviation from blueprint §30/§31 and it must be stated in the README.** Promising EAS and not delivering it is the fastest way to lose the exact audience this product targets.

### The `[BLOCKED-UPSTREAM]` register (tracked, with unblock conditions)

| Capability | Blocked by | Unblocks when |
|---|---|---|
| EAS Build/Submit | `expo` package vs. Metro/Babel collision | EAS gains a non-`expo`-package path, or a Navirox-aware preset is accepted upstream |
| EAS Update / OTA | Same | Same |
| `expo prebuild` | Same | Same |
| `react-native-reanimated` | Upstream: "saved for last" | Upstream ships it |
| Tailwind classes on native | `css-parser`: "Tailwind remains the open seam" | Upstream ships it, or Navirox adds a bridge |
| Third-party RN JS components | Upstream non-goal | Third parties ship native-view wrappers |
| Vue DevTools for native | No upstream hook | §11 research |

---

## 10. MVP 0.1 — task plan

**Definition of Done (blueprint §30 + verified constraints):**

- [ ] `npm create navirox` scaffolds a runnable project
- [ ] Vue 3 + SFC + `<script setup>` + TypeScript
- [ ] Pinia works; a store shared across screens
- [ ] Native primitives render: `view`, `text`, `pressable`, `text-input`, `scroll-view`, plus `Image`, `FlatList`
- [ ] `@navirox/native`: haptics + secure storage (both platforms)
- [ ] **iOS** and **Android** both run the canary
- [ ] Fast Refresh / HMR for SFC and stores
- [ ] `navirox dev` works
- [ ] `navirox doctor` works and is honest (reports `unknown` where unknown)
- [ ] Docs: README + architecture + getting-started
- [ ] Tests: unit (Vitest), contract (seam), one Detox journey per platform
- [ ] CI: lint, typecheck, test, and a **2-cell** iOS/Android build smoke
- [ ] Release process: changesets + `0.1.0` tagged

**Explicitly NOT in 0.1** (say so in the README): EAS, OTA, camera/location/notifications, Nuxt migration, compatibility registry *UI*, Vue DevTools, Tailwind, Reanimated, Windows/Linux host support for builds.

---

## 11. Roadmap 0.1 → 1.0

Each milestone lists **exit criteria** and its upstream dependency. No milestone starts before the previous exits.

### 0.1 — Foundations `[BUILD-NOW]`

Everything in §10. **Exit:** the DoD checklist passes on a clean machine, on both platforms, in CI.

### 0.2 — Router, native APIs, project system `[BUILD-NOW]`

- File-based routing + **typed params** (§5.6) · `_layout.vue` for Stack/Tab/Drawer
- `navirox add <module>` (expo-modules-core plumbing automation — §5.7)
- Native APIs: location, camera, image picker, permissions — **only those upstream actually provides**
- `navirox build ios|android` + `navirox submit` via Fastlane
- Depends on: 0.1 · **Exit:** a real 3-screen app with a tab bar, a deep link, and one camera/image flow ships TestFlight + internal Android track.

### 0.3 — Compatibility registry, VueUse, DSX `[BUILD-NOW]`

- Registry v1 + generated CI matrix (§5.8, §18); `doctor` reads it and `--json` is documented
- VueUse compatibility matrix + `@navirox/vueuse` aware substitutions (blueprint §21)
- Tailwind/Uno bridge — `[OPTIONAL]`, gated on `css-parser`'s seam
- Depends on: 0.2 · **Exit:** the matrix runs nightly and publishes the registry; `doctor` correctly reports at least 40 packages with evidence.

### 0.4 — Nuxt inspection + migration `[BUILD-NOW]`

- `navirox inspect ./my-nuxt-app` → readiness report (`--json`)
- `navirox migrate` for the safe codemod subset (§5.9) with fixture tests
- Shared-code model enforcement in `doctor` (§5.10)
- Depends on: 0.3 · **Exit:** inspect + migrate run against 3 real Vue/Nuxt repos, with a published before/after.

### 1.0 — Production readiness `[BUILD-NOW]`

- Frozen public API for `@navirox/ui|native|router`; SemVer guarantee + deprecation policy
- Compatibility guarantees published as a policy ("we support N, we test M")
- Build/update story resolved — meaning EAS is either **proven** or **officially declined** with a documented alternative
- Docs site, examples, CI matrix, migration tooling, at least one production app in the wild
- Depends on: 0.4 · **Exit:** the §23 1.0 DoD is met and a third party ships to the App Store using Navirox without help.

### Milestone dependency graph

```
0.1 ──▶ 0.2 ──▶ 0.3 ──▶ 0.4 ──▶ 1.0
 │       │       │       │
 └───────┴───────┴───────┴──▶ PROOFS A/B/C (§8) gate 0.1 only
                              §9 Expo verdict gates 0.2's `build` scope
```

---

## 12. Validation matrix

Every claim in the README must map to a row here and a test that backs it.

| Dimension | Values to test | Where | Blocks |
|---|---|---|---|
| Platform | iOS (sim + device), Android (emulator + device) | Detox + CI | 0.1 |
| Runtime version | pinned `@symbiote-native/*` majors | contract tests | 0.3 |
| RN version | `>=0.86` floor + latest | matrix | 0.3 |
| Vue version | 3.4 / 3.5 / 3.6 | matrix | 0.3 |
| Node | 20 LTS / 22 / 24 (local is 24.21.0) | CI | 0.1 |
| Package manager | pnpm 11.x (**local is 12.4.1**) | CI + `packageManager` pin | 0.1 |
| Pinia | 2.x / 3.x | integration | 0.1 |
| VueUse | per-composable matrix | 0.3 | 0.3 |
| expo-modules-core wrappers | install → link → run, per platform | 0.2 | 0.2 |
| Expo/EAS | E1–E6 (§9) | spike | 0.2 |
| HMR | SFC edit, store edit, config edit | manual + e2e | 0.1 |
| Migration fixtures | fixed corpus → expected diff + TODOs | Vitest | 0.4 |
| New Architecture | must be ON; legacy must error | `doctor` | 0.1 |
| `expo` meta-package | must be ABSENT; presence must error | `doctor` | 0.1 |

---

## 13. Risk register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| **R-01** | **Symbiote is beta and churns majors fast** (`vue` 0.3.x→2.0.0 in ~3 months) | High | High | Pin exactly; `runtime-symbiote` is the only edge; registry + matrix detect breakage in CI; never expose Symbiote types in `@navirox/*` public API. |
| **R-02** | **Bus factor 1** (65 stars, 1 fork, single author, 12 open issues) | High | Critical | Design for replacement (§5.2); track upstream commits; publish a "runtime status" page; keep a second-runtime spike on the backlog. |
| **R-03** | Upstream ships its own scaffolder, absorbing Navirox's entry point | Medium | High | Front-load the assets upstream won't build: migration, registry, shared-code model, DX. Never let `create` be the *only* value. |
| **R-04** | EAS is unusable (§9) and users expect it | High | Medium | State it before they ask; ship Fastlane + raw toolchain; publish the E1–E6 results. |
| **R-05** | `expo` peer pollution breaks installs (`auto-install-peers` pulls the phantom `expo` tree) | High | Medium | `doctor` detects `expo` in the graph; documented Podfile/Gradle exclude lists; pin `expo-modules-autolinking`. |
| **R-06** | Android parity lags iOS | Medium | Medium | G2 is a hard gate; never claim Android without a green run. |
| **R-07** | `expo-modules-autolinking` internals change (Ruby arity already changed in 57.0.8) | High | High | Pin; **encode the plumbing as `navirox add`** so a fix lands in one place; verify with `xcodebuild`, not just `pod install`. |
| **R-08** | Route params are untyped upstream and stay that way | Medium | Low | Navirox generates types above the seam — turns a gap into a feature. |
| **R-09** | Licensing/trademark (**packages are MIT — good**; name/scope unverified) | Low | High | Dependency license audit; verify `navirox` npm scope + trademark before publishing. |
| **R-10** | Environment gaps (no `watchman`, no `adb` on PATH, pnpm 12 vs 11) | High | Low | Day 0 reconciliation; `navirox doctor` checks these and tells the user the fix. |
| **R-11** | `react-native` is a hard app-root dep — users may expect it hidden | Certain | Low | Document it as upstream's deliberate non-goal. |
| **R-12** | Perf/behaviour regressions from the renderer swap under real apps | Medium | High | Detox e2e using upstream's own shared-spec trick (one spec, same `testID`s). |
| **R-13** | Scope: 15 requested areas ⇒ plan-to-nowhere | High | High | Gates G0–G5 + milestone exit criteria; nothing starts before its gate. |
| **R-14** | Renaming/positioning churn (`<project-name>` in the blueprint) | Medium | Low | `navirox` is now canonical across packages, CLI, config, and docs. |
| **R-15** | Third-party RN JS components can't be used (upstream non-goal) | High | Medium | Documented boundary + a `navirox add` path that wraps native views. |

---

## 14. GO / NO-GO criteria

### Sprint gates

See §8 (G0–G5). Repeating the two hard ones:

- **G1 (iOS render)** — NO-GO ⇒ stop; re-evaluate the runtime before writing more code.
- **G3 (seam holds)** — NO-GO ⇒ adopt Option A in §4 and record the honesty cost.

### Milestone gates

| Gate | Question | NO-GO action |
|---|---|---|
| **0.1** | Does `create → dev → simulator` work on a clean machine, both platforms, in CI? | Not releaseable. Stay in 0.0.x. |
| **0.2** | Does a real 3-screen app with a deep link + one native module ship to TestFlight + internal track? | Do not start 0.3. |
| **0.3** | Does the registry run nightly and correctly report ≥40 packages with evidence? | Do not claim compatibility guarantees. |
| **0.4** | Do inspect + migrate run on 3 real repos with published before/after? | Do not start 1.0. |
| **1.0** | Has a third party shipped to a store unaided? | Not 1.0. Call it 0.x. |

### Global kill criteria (be explicit, and honour them)

- Upstream ships a scaffolder **and** a compatibility matrix **and** migration tooling ⇒ Navirox's differentiation collapses → **merge upstream or shut down.**
- Symbiote is abandoned ⇒ execute the runtime replacement; if no replacement is viable, **stop** — Navirox must not fork a renderer.
- EAS matters more to users than migration/registry and remains blocked ⇒ **re-position** around the raw toolchain, or accept a smaller market.

---

## 15. Anti-Symbiote / anti-fork strategy

### The test, applied honestly

Upstream's roadmap commits to **full Expo SDK parity** and it already owns components, styles, navigation, portals, and 28 native packages. Therefore: **anything on that roadmap will be absorbed.** Navirox must invest where upstream's own non-goals protect it.

| Navirox surface | If Symbiote ships it tomorrow | Verdict |
|---|---|---|
| `@navirox/ui` components | Absorbed | ❌ not a moat |
| `@navirox/native` wrappers | Absorbed | ❌ not a moat |
| Navigators | Already shipped | ❌ never build |
| Styling | Already shipped | ❌ never build |
| `create-navirox` | A competitor, not an absorber — assume upstream eventually does it | ⚠️ necessary, not durable |
| **Typed file-based routing** | Upstream types params | ⚠️ medium |
| **`navirox add` (native plumbing automation)** | Upstream documents it manually and ships `expo-modules-link` | ⚠️ medium-high |
| **Compatibility registry + CI matrix** | Unlikely — it is *their* testing cost, not their product | ✅ **high** |
| **`inspect` + `migrate` (Nuxt/Vue)** | Protected by upstream's own non-goals and by being out of scope | ✅ **very high** |
| **Shared-code model + `doctor` enforcement** | Not a renderer concern | ✅ **high** |
| **Docs/teaching for Vue teams** | Not their audience | ✅ **high** |
| **The brand + the Vue-team community** | Cannot be absorbed | ✅ **highest** |

### Anti-fork test (per asset)

Because the renderer is *consumed*, Navirox's fork-resistance is not adapter volume — it is **accumulated workflow knowledge**:
50 compatibility entries (medium) → migration corpus (hard) → published migration outcomes on real repos (very hard) → the Vue-team mindshare built by consistently honest docs (hardest).

### What must remain Navirox-specific

1. Config format, CLI verbs, and package scope.
2. The route manifest and its typing.
3. The registry schema, data, and CI matrix.
4. The migration corpus and codemods.
5. The shared-code doctrine and its enforcement.
6. The runtime seam itself.

### What should go upstream (and be contributed)

- `expo-modules-autolinking` shim fixes (we will hit the same Ruby arity bug).
- Bug reports and reproductions from the matrix — this earns influence and is cheap.
- A Vue-typed route-params proposal, if it fits the shared core.
- **Contributing is a strategic asset, not charity:** it buys upstream responsiveness and makes abandonment less likely (R-02).

---

## 16. Developer experience — the intended final DX

```bash
# Create
npm create navirox
npx navirox init                 # in an existing Vue/Nuxt repo

# Develop
npx navirox dev                  # Metro + HMR + simulator/emulator
npx navirox doctor               # versions, deps, compatibility, fix-it hints  [--json]

# Understand
npx navirox inspect ./my-nuxt-app       # readiness report  [--json]

# Move
npx navirox migrate src/                # codemods + TODO list

# Add
npx navirox add expo-haptics            # native plumbing, one command

# Ship
npx navirox build ios | android
npx navirox submit ios | android
npx navirox update                      # honest: see §9
```

**`navirox doctor` output contract** (this command is the product's credibility):

```
Navirox doctor — runtime symbiote 2.0.0

  Environment      node 24.21.0  pnpm 12.4.1  Xcode 27.0  Java 17
  Runtime          @symbiote-native/vue 2.0.0   engine 0.5.0   navigation 4.0.1
  React Native     0.86.x   New Architecture: ON  ✅

  Compatibility
    pinia                    ≥2.2 <4            full         ✅ tested iOS
    vueuse                   —                 partial 82%   🟡 18 unsupported
    expo-haptics             —                 full         ✅ tested iOS + Android
    react-native-reanimated  —                 unsupported  ❌ use Animated
    leaflet                  —                 unsupported  ❌ platform-specific

  ⚠ 3 compatibility issues detected
  ✗ `expo` meta-package present — remove it (collides with the Metro/Babel preset)
  ⚠ watchman not found — install for reliable HMR
  ⚠ adb not on PATH — Android deploys will fail
```

**Design rules:** never guess — print `unknown`; always pair a problem with a fix; `--json` everywhere; exit codes are contractual (§5.5).

---

## 17. Vue/Nuxt migration strategy

**The doctrine:** share everything that makes sense, rewrite only the truly native layer. Never promise 100% shared UI (blueprint §8).

### The three categories (blueprint §9) — operationalised

| Category | Definition | Examples | Tool behaviour |
|---|---|---|---|
| **A · Shared** | Same code on web and native | types, `defineStore`, pure functions, validation, API clients | keep; **enforce** by lint |
| **B · Adaptable** | Same intent, different API | `localStorage`, `window.location`, `navigator.*`, `<input file>` | rewrite when safe; else TODO |
| **C · Platform-specific** | No native equivalent | Leaflet, DOM layout, `:hover`, `<canvas>` | report + plan; **never** auto-rewrite |

### Readiness report (blueprint §4/§22/§48)

```
Navirox inspect ./my-nuxt-app

  ✓ Nuxt project detected            Nuxt 3.x
  ✓ Vue detected                     3.5.x
  ✓ Pinia detected                   3 stores
  ✓ Shared types detected            12 interface files
  ✓ API modules detected             4 modules (fetch-based)

  Components analysed                63
    · portable                       41
    · adaptable                      15
    · needs rewrite                   7

  Composables                        28 analysable · 21 compatible · 7 unsupported
  Composable support                 84%
  Browser-API usages                 23  (localStorage 11, window 6, navigator 3, …)

  Ready for `navirox migrate`. 7 components need manual work — see report.json
```

**Classification rules (deterministic, testable):**

- Imports `window`/`document`/`localStorage` ⇒ B, unless used for layout ⇒ C.
- Imports a map/chart/canvas/PDF library ⇒ C.
- Pure TS with no browser and no native import ⇒ A.
- Uses Nuxt-only composables (`useFetch`, `useAsyncData`, Nuxt `useRoute`) ⇒ B (adapt to `@navirox/router` / fetch).

**Codemod policy:** AST-based; each codemod is a pure, fixture-tested function; **never** silently rewrite category C; every rewrite emits a machine-readable TODO with a doc link.

---

## 18. Compatibility strategy

### Axes

Vue (3.4/3.5/3.6) · React Native (`>=0.86` floor + latest) · `@symbiote-native/*` (pinned majors) · iOS (deployment floor — **16.4 required when Expo modules are linked**) · Android (API levels) · Node (20/22/24) · pnpm (11.x) · RN packages · expo-modules-core packages · VueUse composables.

> **Note:** "Expo SDK versions" is **not** an axis until §9 proves the `expo` package usable. Record it as `[BLOCKED-UPSTREAM]` rather than listing a matrix that cannot run.

### CI matrix policy

1. A cell runs only if the combo is **installable** — installability is a cheap pre-filter.
2. Every green cell writes an evidence row into `registry/`.
3. Nightly full matrix; PRs run the pinned-version cell only.
4. Failures are **published**, not hidden — an honest matrix is the moat.

### Support policy (publish it at 1.0)

- **Supported:** combinations with a green cell in the last 14 days.
- **Untested:** everything else, stated as `unknown` — **not** "unsupported".
- A package may only be called `full` with a passing evidence row.

---

## 19. Testing strategy

| Layer | Tool | What it proves | In 0.1? |
|---|---|---|---|
| Unit | Vitest | Pure logic: route manifest generation, codemods, registry queries | ✅ |
| Component/integration | Vitest + fake Fabric slot | SFC renders; reactivity; store wiring (no simulator) | ✅ |
| **Contract (seam)** | Vitest | `@navirox/ui\|native\|router` work against a **stub runtime** ⇒ replaceability is real | ✅ (Proof B) |
| **Import boundary** | dep-cruiser + custom rule | app code has zero Symbiote imports; toolchain plane never imports Symbiote | ✅ |
| Tooling | Node built-in runner | CLI / `*.test.mjs` against the shipped module format | ✅ |
| E2E | Detox, iOS + Android | Real native build; **shared spec + shared `testID`s** (upstream's proven trick) | ✅ (1 journey/platform) |
| HMR | Manual script + e2e assertion | SFC edit and store edit both hot-update | ✅ |
| Compatibility | Generated CI matrix | Registry evidence | 0.3 |
| Migration fixtures | Vitest | input repo → expected diff + expected TODOs | 0.4 |
| Regression | Detox + Vitest | Every fixed bug gets a test | ongoing |
| Snapshot | Vitest | Route manifest, registry JSON, `doctor --json` shape | ✅ (narrow, deliberate) |

**Rules:** no claim without a test (§12); the seame contract test uses a *real* stub runtime, never a mock of the seam; e2e must build real native binaries (a JS-only test cannot prove the renderer).

---

## 20. Open-source project structure

```
navirox/
├── .github/
│   ├── workflows/{ci.yml, matrix-nightly.yml, release.yml, docs.yml}
│   ├── ISSUE_TEMPLATE/{bug.yml, feature.yml, compatibility-report.yml, rfc.yml}
│   └── pull_request_template.md
├── CONTRIBUTING.md          # dev setup, pnpm 11, no-Symbiote-in-toolchain rule, test matrix
├── CODE_OF_CONDUCT.md       # Contributor Covenant
├── CHANGELOG.md             # changesets-generated
├── SECURITY.md
├── GOVERNANCE.md            # who decides, how RFCs pass
├── rfcs/                    # NNNN-title.md — public API changes require an RFC
├── docs/                    # documentation site
├── examples/                # runnable, CI-verified
└── registry/                # versioned compatibility data
```

- **Versioning:** SemVer per package; Changesets; `@navirox/ui|native|router` follow Navirox's own majors (they are façades — Symbiote's majors must never force a Navirox major).
- **Publishing:** npm scope `@navirox` + `create-navirox`; provenance enabled; canary on `main`.
- **Docs site:** getting started, architecture (the §5 diagram), compatibility (live registry), migration guide, RFC index, and an **honest limitations page** (§9 register).
- **RFC process:** required for any public-API change; template in `.github/ISSUE_TEMPLATE/rfc.yml`.
- **Governance:** start BDFL-with-RFCs; state the bus-factor plan explicitly (R-02).

---

## 21. Decision log

| # | Decision | Alternatives | Reason | Trade-off | Reversibility |
|---|---|---|---|---|---|
| **D1** | Thin curated façade + owned non-renderer core (§4 Option C) | A pure façade; B own implementation | Only option that satisfies both "not a wrapper" and "don't rebuild upstream" | Façade must be maintained against churn | Medium — depth can change without touching the core |
| **D2** | `NativeRuntime` seam owned by Navirox; only `runtime-symbiote` imports Symbiote | Couple directly to Symbiote | Delivers real replaceability; contains R-01/R-02 | An abstraction to maintain | High — removing a seam is easy |
| **D3** | pnpm workspaces + Turborepo + Changesets | npm/yarn; Nx | Matches upstream + local tooling; fast, simple | Turborepo is an extra dep | High |
| **D4** | Ship backend = raw Xcode/Gradle + Fastlane, **not EAS** (§9) | EAS per blueprint §30 | `expo` package provably collides | More plumbing; no managed build | High — EAS can be added if E1–E4 ever pass |
| **D5** | Navirox does **not** build navigators; adds file-based + typed routing | Build a router | Upstream ships native Stack/Tab/Drawer | Depend on upstream nav majors | High |
| **D6** | Navirox does **not** build components or native APIs; curates and versions them | Own components | Upstream owns 28 packages + full parity ambition | Churn exposure | High |
| **D7** | Compatibility registry is CI-generated, never hand-written | Hand-maintained matrix | Prevents rot; makes the moat real | CI cost | High |
| **D8** | Migration is AST-based with fixture tests; never regex | Regex/string transforms | Correctness over speed (explicit user requirement) | Slower to build | High |
| **D9** | MIT license | Apache-2.0 | Matches upstream + all deps; simplest for adoption | No patent grant | Low |
| **D10** | Detox for e2e, with shared spec + `testID`s | Maestro; Appium | Upstream-proven; one spec across adapters | Detox setup cost | Medium |
| **D11** | EAS/OTA/reanimated/Tailwind recorded as `[BLOCKED-UPSTREAM]` | Promise them | Honesty is the product's differentiator | Smaller initial feature list | High |
| **D12** | `react-native` stays an explicit app-root dependency | Hide it | Upstream non-goal; hiding breaks Metro/native resolution | Users see RN in `package.json` | Low |

---

## 22. First GitHub issues (paste-ready)

Every issue: **title · description · prerequisites · implementation notes · acceptance criteria · tests · complexity · dependencies.**
Complexity: `S` ≤ half-day · `M` ≤ 2 days · `L` ≤ 5 days.

---

### NX-001 — Bootstrap the Navirox monorepo `[BUILD-NOW]`

- **Blocks:** everything. **Complexity:** M
- **Description:** Create the pnpm/Turborepo monorepo in `ORG/navirox` with the §6 layout, TS project references, lint, and CI skeleton.
- **Prerequisites:** none
- **Implementation notes:** `pnpm-workspace.yaml`; `packageManager` pinned to **pnpm 11.x** (local is 12.4.1 — record the decision); root `tsconfig` with project references; `turbo.json` for `build|test|lint|typecheck`; `.changeset/`; placeholder `packages/*` workspaces that build empty.
- **Acceptance criteria:** `pnpm install && pnpm build && pnpm test` green on a clean clone; CI runs on PR; `packages/` matches §6.
- **Tests:** CI config itself; a trivial smoke test per package.
- **Dependencies:** none

### NX-002 — Toolchain reconciliation + doctor preflight `[BUILD-NOW]`

- **Blocks:** NX-003. **Complexity:** S
- **Description:** Make the dev environment provably capable before writing product code (Day 0 / G0).
- **Prerequisites:** NX-001
- **Implementation notes:** document + script: install `watchman`; add `$ANDROID_HOME/platform-tools` to PATH; confirm Fabric/New Arch; pin pnpm; verify a **stock upstream canary** (`examples/react`, then `examples/vue-sfc`) builds on iOS **and** Android.
- **Acceptance criteria:** written log showing both canaries running on both platforms from this machine; all gaps fixed or explicitly documented.
- **Tests:** n/a (evidence artifact committed to `docs/`)
- **Dependencies:** NX-001

### NX-003 — `@navirox/runtime` seam + stub runtime `[BUILD-NOW]`

- **Blocks:** NX-004, NX-005. **Complexity:** M
- **Description:** Implement the §5.2 `NativeRuntime` interface and a **stub** implementation used only by tests.
- **Prerequisites:** NX-001
- **Implementation notes:** keep the interface under ~20 members; include `capabilities`; **no** Symbiote import in this package; publish types plus a tiny runtime.
- **Acceptance criteria:** interface exported; stub satisfies it; a consumer compiles against the stub with zero Symbiote present.
- **Tests:** contract test compiling `@navirox/ui|native|router` against the stub (this is **Proof B**).
- **Dependencies:** NX-001

### NX-004 — `@navirox/runtime-symbiote` `[BUILD-NOW]`

- **Blocks:** NX-005, NX-006. **Complexity:** L
- **Description:** The **only** package allowed to import Symbiote. Implements `NativeRuntime` over `@symbiote-native/*`.
- **Prerequisites:** NX-002, NX-003
- **Implementation notes:** pin `@symbiote-native/vue@^2.0.0`, `engine@^0.5.0`, `navigation@^4.0.1`, `react-native>=0.86`; ship `runtime.json` (§5.3); map `mount`→`AppRegistry`; expose `hostComponents`; wire `nativeModules`; register `react-native-screens` configs via upstream's `register` side-effect import.
- **Acceptance criteria:** `examples/vue-basic` renders on iOS **and** Android; `runtime.json` matches installed versions; no other package imports Symbiote.
- **Tests:** contract tests vs. `@navirox/runtime`; import-boundary test.
- **Dependencies:** NX-002, NX-003

### NX-005 — `@navirox/metro-preset` (SFC + CSS pipeline) `[BUILD-NOW]`

- **Blocks:** NX-006. **Complexity:** M
- **Description:** Compose the Vue SFC transformer and `@symbiote-native/css-parser` into one documented preset, so a Navirox app needs one line of Metro config.
- **Prerequisites:** NX-002
- **Implementation notes:** study `examples/vue-sfc`'s Metro config; make it configurable via `navirox.config.ts`; **never** depend on the `expo` package; document the collision this avoids.
- **Acceptance criteria:** an app with this preset renders `<style scoped>` correctly; classes resolve; no `expo` in the dependency graph.
- **Tests:** unit test asserting resolved preset shape; e2e style assertion in `examples/vue-basic`.
- **Dependencies:** NX-002

### NX-006 — `create-navirox` + `navirox dev` `[BUILD-NOW]`

- **Blocks:** 0.1 release. **Complexity:** L
- **Description:** `npm create navirox` scaffolds a runnable app; `navirox dev` runs it. **G5 gate.**
- **Prerequisites:** NX-004, NX-005
- **Implementation notes:** template per §8 Day 6; pinned deps; prompt for name; `--json` non-interactive; `navirox dev` = Metro + platform launch + HMR; fail with actionable messages if Xcode/Android SDK/`watchman` are missing.
- **Acceptance criteria:** on a **clean machine**, `npm create navirox` → `cd` → `npx navirox dev` → app on iOS **and** Android; `--help` accurate.
- **Tests:** e2e: scaffold into a temp dir, `pnpm install`, build both platforms in CI.
- **Dependencies:** NX-004, NX-005

### NX-007 — `navirox doctor` v1 `[BUILD-NOW]`

- **Blocks:** 0.1. **Complexity:** M
- **Description:** Implement §16's output contract, including environment checks and **honest** compatibility reporting.
- **Prerequisites:** NX-004
- **Implementation notes:** check node/pnpm/Xcode/Java/`watchman`/`adb`/`ANDROID_HOME`; detect the **`expo` meta-package and error**; verify New Architecture; read the registry; `--json`; exit codes §5.5; print `unknown` — never guess.
- **Acceptance criteria:** on the canary, output matches §16's shape; presence of `expo` produces exit code 3; `--json` schema snapshot-tested.
- **Tests:** unit per check; snapshot of `--json`; a fixture project with `expo` installed must fail.
- **Dependencies:** NX-004

### NX-008 — `@navirox/native` façade: haptics + secure storage `[BUILD-NOW]`

- **Blocks:** 0.1. **Complexity:** M
- **Description:** First curated native APIs with Vue-first signatures, exposed over the seam.
- **Prerequisites:** NX-004
- **Implementation notes:** `useHaptics()`, `useSecureStorage()`; **document Android caveats** (secure-store Auto Backup attributes); do not leak Symbiote types.
- **Acceptance criteria:** both work on both platforms in the canary; types are Navirox's own; no Symbiote type in the public `d.ts`.
- **Tests:** contract test vs. stub runtime; manual e2e on both platforms.
- **Dependencies:** NX-004

### NX-009 — `navirox add <module>` (Expo-module plumbing) v1 `[BUILD-NOW]`

- **Blocks:** 0.2. **Complexity:** L
- **Description:** Automate §5.7's verified manual wiring — the highest-value near-term brick.
- **Prerequisites:** NX-004, NX-007
- **Implementation notes:** pin `expo-modules-autolinking`; generate the Podfile Ruby shims (**including the 57.0.8 `generate_support_script` 4-arg signature**), `settings.gradle` `includeBuild`, root `build.gradle` classpath, `app/build.gradle` + `MainApplication.kt` regions via `@symbiote-native/expo-modules-link`, `xcodeproj` file references via the `xcodeproj` gem, the **iOS 16.4 deployment-target bump**, `Info.plist` keys, Android `<application>` attributes; **verify with `xcodebuild` and `gradlew`, not just `pod install`**.
- **Acceptance criteria:** `navirox add expo-haptics` then build succeeds on **both** platforms from a clean checkout; re-running is idempotent; `doctor` reflects the new module.
- **Tests:** fixture project; idempotency test; CI build on both platforms.
- **Dependencies:** NX-004

### NX-010 — Detox e2e harness + shared journey `[BUILD-NOW]`

- **Blocks:** 0.1 DoD. **Complexity:** M
- **Description:** One journey, shared `testID`s, both platforms — copying upstream's proven approach.
- **Prerequisites:** NX-006
- **Implementation notes:** handle the perpetual-animation gotcha (`detoxEnableSynchronization: 0` + explicit `waitFor`); scripts per example, not at root.
- **Acceptance criteria:** `e2e:test:ios` and `e2e:test:android` pass in CI against the canary.
- **Tests:** the journey itself.
- **Dependencies:** NX-006

### NX-011 — Compatibility registry schema + seed `[BUILD-NOW]`

- **Blocks:** NX-012, 0.3. **Complexity:** M
- **Description:** Implement §5.8's schema + `@navirox/compat` queries, seeded with what Days 1–7 actually proved.
- **Prerequisites:** NX-004, NX-007
- **Implementation notes:** no Symbiote import; Zod schema; `unknown` default; **no entry without an evidence reference**.
- **Acceptance criteria:** `doctor` reads it; schema snapshot-tested; every seeded entry cites a real test.
- **Tests:** schema validation; a fixture entry with missing evidence must fail validation.
- **Dependencies:** NX-004

### NX-012 — `.vue` route manifest + typed params `[0.2]`

- **Description:** Scan `app/`, generate `routes.d.ts` + upstream navigation config (§5.6).
- **Complexity:** L · **Prerequisites:** NX-004, NX-011
- **Acceptance criteria:** `useRouter().push('profile/[id]', { id: '42' })` type-checks; a bad param fails `tsc`; deep links resolve.
- **Tests:** manifest generation fixtures; type-level (`expect-type`) tests; e2e deep link.

### NX-013 — `navirox inspect` (Nuxt/Vue readiness) `[0.4]`

- **Description:** §17's report; AST-based; `--json`.
- **Complexity:** L · **Prerequisites:** NX-011
- **Acceptance criteria:** on 3 real repos, the classification matches a hand-audited ground truth within an agreed tolerance; `--json` schema-stable.
- **Tests:** fixture repos with expected classifications.

### NX-014 — `navirox migrate` codemods v1 `[0.4]`

- **Description:** Safe subset only (§5.9 table); TODO markers for the rest.
- **Complexity:** L · **Prerequisites:** NX-013
- **Acceptance criteria:** each codemod is a pure, fixture-tested function; migrations produce a reviewable diff; **no** silent rewrite of category C; idempotent.
- **Tests:** fixture corpus; idempotency; TODO-completeness assertions.

### NX-015 — Expo/EAS feasibility spike (E1–E6) `[RESEARCH]`

- **Description:** Execute §9 and publish the verdict table.
- **Complexity:** M · **Prerequisites:** NX-006
- **Acceptance criteria:** every hypothesis has a written result with evidence; the README limitation page is updated from it; the `[BLOCKED-UPSTREAM]` register is accurate.
- **Tests:** n/a — the artefact is the published result.

### NX-016 — `navirox build ios|android` + Fastlane submit `[0.2]`

- **Description:** Raw-toolchain build + store submission (§9 fallback).
- **Complexity:** L · **Prerequisites:** NX-009, NX-015
- **Acceptance criteria:** a release build for both platforms from CI; Fastlane `deliver`/`supply` documented; no EAS dependency.
- **Tests:** CI release-build smoke.

### NX-017 — Compat CI matrix + nightly `[0.3]`

- **Description:** §18 matrix that **writes the registry**.
- **Complexity:** L · **Prerequisites:** NX-011
- **Acceptance criteria:** nightly run publishes evidence rows; failures are published, not hidden; ≥40 packages covered.
- **Tests:** the matrix itself + registry-validation test.

### NX-018 — Docs site + limitations page `[BUILD-NOW → 1.0]`

- **Description:** Getting started, architecture (§5 diagram), migration guide, live compatibility, **honest limitations**.
- **Complexity:** M · **Prerequisites:** NX-006
- **Acceptance criteria:** a stranger completes getting-started unaided; the limitations page states EAS/OTA/reanimated/Tailwind/third-party-RN-component status accurately.
- **Tests:** docs build in CI; link check.

---

## 23. Definition of Done (per milestone)

### 0.0.1 — Sprint artifact

- [ ] `examples/vue-basic` runs on iOS **and** Android
- [ ] App code imports **only** `@navirox/*` (import-boundary test green)
- [ ] Stub-runtime contract test green (**Proof B**)
- [ ] One `expo-modules-core` module working (**Proof C**) *or* a written NO-GO
- [ ] Registry seeded with evidence from the sprint
- [ ] Architecture doc + README + recorded demo
- [ ] **All of G0–G5 recorded with results**

### 0.1 — Foundations

- [ ] §10 checklist complete
- [ ] `create → dev → simulator` verified on a clean machine, both platforms
- [ ] `doctor` honest, `--json` snapshot-tested, errors on `expo` present
- [ ] CI: lint + typecheck + unit + contract + import-boundary + Detox (both platforms)
- [ ] `0.1.0` released via changesets
- [ ] Limitations page published

### 0.2 — Router / native APIs / project system

- [ ] Typed file-based routing; `tsc` rejects bad params
- [ ] Tab + Stack + Drawer layouts; one deep link per navigator
- [ ] `navirox add` idempotent and CI-verified on both platforms
- [ ] One real app shipped to TestFlight + internal Android track
- [ ] `navirox build` / `submit` documented and CI-proven

### 0.3 — Compatibility / VueUse / DX

- [ ] Nightly matrix writes the registry
- [ ] ≥40 packages with evidence; `doctor` accurate incl. `unknown`
- [ ] VueUse matrix published
- [ ] Tailwind/Uno assessed as a written yes/no (likely NO)

### 0.4 — Nuxt inspection / migration

- [ ] `inspect` on 3 real repos, ground-truthed
- [ ] `migrate` safe subset, idempotent, fixture-tested
- [ ] Shared-code enforcement in `doctor` / CI
- [ ] Before/after published

### 1.0 — Production readiness

- [ ] `@navirox/ui|native|router` API frozen + SemVer/deprecation policy
- [ ] Compatibility *policy* published (supported = green cell ≤14 days)
- [ ] EAS proven **or** officially declined in writing
- [ ] Docs site, examples, matrix, migration tooling complete
- [ ] **A third party ships to a store unaided**

---

## 24. Classification of every workstream

### `[BUILD-NOW]` — required, evidence-backed, schedulable today

NX-001 … NX-012, NX-016, NX-017, NX-018; §5.2–§5.11; §6–§8; §16–§20.

### `[RESEARCH]` — must be investigated before promising

- **E1–E6 Expo/EAS** (§9) — expected to resolve to BLOCKED, but must be *proven*
- Vue DevTools for native (no upstream hook — feasibility unknown)
- `useCamera` / `useLocation` / `useNotifications` (no upstream wrapper today)
- Second-runtime spike (kills R-02 permanently)
- VueUse substitution completeness

### `[OPTIONAL]` — only if the core lands

- Tailwind/Uno bridge (`css-parser`'s open seam)
- Desktop target (blueprint §49 — explicitly out of early scope)
- Migration Cloud / Compatibility Cloud (blueprint §40 — needs 1.0 trust first)
- `@navirox/vueuse` shim package

### `[BLOCKED-UPSTREAM]` — cannot be built by Navirox

- EAS Build / Update / Submit · Expo Dev Client · `expo prebuild` (assuming E1–E4 fail)
- `react-native-reanimated` (upstream: "saved for last")
- Tailwind classes on native (upstream seam)
- Third-party RN JS components (upstream **non-goal**)
- Route param generics in upstream navigation (Navirox compensates above the seam)

---

## Appendix A — Verified facts this plan rests on

**SymbioteNative** — `github.com/OneEyed1366/symbiote-native`, **MIT**, beta, created 2026-06-20, last push 2026-09-15, 65 stars / 1 fork / 12 open issues, single author.

**npm (as checked):** `@symbiote-native/vue` **2.0.0** (2026-09-14) · `@symbiote-native/navigation` **4.0.1** (2026-09-15) · `@symbiote-native/engine` **0.5.0** (peer `react-native >=0.86`) — all MIT.

**Symbiote capabilities (from docs):** intrinsic `view`/`text`/`pressable`/`text-input`/`scroll-view`; list components imported; SFC + TSX; SFC `<style scoped>` → native styles; CSS / CSS Modules / SCSS / Sass / Less / Stylus via `css-parser` (+ `css-dts`, `typescript-plugin`); `v-model`, `v-show`, `Teleport`, `createTunnel`, `AppRegistry`; `Animated`/`PanResponder`; re-exported runtime modules (StyleSheet, Dimensions, Platform, Alert, Linking, Keyboard, Vibration, PermissionsAndroid, `useWindowDimensions`, `useColorScheme`, …); **Android Keyboard/Settings require `@symbiote-native/android`**.

**Navigation (docs):** native Stack via `react-native-screens`; pure-JS Tab + Drawer; explicit verbs (`push`/`pop`/`replace`/`reset`/`jumpTo`/`openDrawer`); **no `navigate()`**; `useNavigation`/`useRoute`/`useIsFocused`/`useFocusEffect`/`useNavigationState` + navigator-specific hooks; **route params typed `unknown`**; linking + state persistence; shared `core/` across 5 adapters.

**Testing (docs):** Vitest headless against a **fake Fabric slot**; Node built-in runner for `*.test.mjs` / `*.test.cjs`; **Detox** e2e with a `canary-journeys` spec shared byte-for-byte across `examples/react`, `vue-sfc`, `vue-tsx`, `svelte` (same `testID`s); Angular has its own Detox; Solid has none.

**Expo (docs):** the `expo` meta-package is **never** installed (Metro/Babel collision with the Vue SFC + CSS-parser transforms); `expo-modules-core` wrappers work via manual wiring (`expo-modules-autolinking` devDep; Podfile Ruby overrides incl. a `generate_support_script` **4-arg** signature in autolinking 57.0.8; iOS runtime hook `SymbioteExpoModulesFactory.mm`; `settings.gradle` `includeBuild`; root `build.gradle` classpath; `app/build.gradle` + `MainApplication.kt` generated regions via `@symbiote-native/expo-modules-link`; `xcodeproj` gem edits; **iOS 16.4 deployment target**; `Info.plist` keys; Android `<application>` attributes); verify with `xcodebuild` + `gradlew`, **not** `pod install` alone.

**Upstream non-goals (docs):** forking RN native sources; hiding `react-native` as a transitive dep; making third-party RN JS components framework-agnostic; replacing Yoga/Fabric. Roadmap goal: **full Expo SDK parity**, with **Reanimated last** and **Tailwind an open seam**.

**Local toolchain (checked):** node **24.21.0** · pnpm **12.4.1** (docs want **11.x**) · npm 11.19.0 · bun 1.4.0 · Xcode **27.0** (27A266a) · Ruby 4.0.6 · CocoaPods 1.17.0 · Java 17.0.20.1 · `ANDROID_HOME=/Users/memo/Library/Android/sdk` · **watchman MISSING** · **adb MISSING from PATH** · iPhone 17 / 17 Pro / 17 Pro Max / 17e / Air simulators available.

**Workspace:** `/Users/memo/projects/active/apps/navirox` contains **only `blueprint.md`** (22,549 bytes); **no git repository yet**.

---

## Appendix B — Immediate next action

If you approve this plan, the first three things to do, in order:

1. **NX-002 (G0)** — reconcile the toolchain and prove a *stock upstream canary* runs on iOS and Android from this machine. Nothing else is meaningful until this is green.
2. **NX-001** — bootstrap the monorepo (§6) with pnpm pinned to 11.x.
3. **NX-003 + NX-004** — land the seam and the Symbiote adapter, then Day 1's iOS render.

**The plan is deliberately gated so that the first irreversible spend happens only after G1 (iOS render) and G3 (seam holds). Those two gates are where this product is won or lost.**

