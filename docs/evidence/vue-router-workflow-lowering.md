# Vue Router workflow lowering evidence

Date: 2026-09-24

## Scope

This evidence covers the bounded Vue Router profile implemented by `vue-router-workflow-lowering`. It covers the Workflow IR v4 route and navigation contract, Vue route inspection and lowering, target-native route metadata, the source-owned route-aware Vue workspace, and the T2 workspace verifier. It does not claim browser interaction, device journeys, native iOS or Android execution, SSR, Nuxt middleware, guard execution, or visual fidelity.

## Supported profile

- Routes: literal top-level and nested `createRouter` route tables.
- Route paths: literal strings with simple named parameters such as `:id`.
- Route names: optional literal strings.
- Components: statically imported component units that resolve to source files. Nested routes inherit a resolved parent component when they omit `component`.
- Navigation: literal `RouterLink`/`router-link` `to` values, including a concrete value matching a parameterized route, and literal no-argument `router.push(literalPathOrNamedRoute)` calls, inline or through a named no-argument function.
- Named route parameters: literal string values for every required parameter and no extra parameters.
- Target: neutral `generated/routes.json` metadata plus deterministic Vue navigation handlers and a source-owned `vue-router` workspace entry.
- Event binding: explicit `actionId` links resolve against state actions or navigation actions on the same screen.

The target does not read the source SFC. It emits only from the Workflow IR. The source-owned workspace installs `vue-router`, registers the route-aware `RouterView`, generates a router module with route ids, and maps generated `link` primitives to router-aware anchors.

## Positive run

Fixture:

`packages/source-vue/fixtures/vue-router-workflow/positive`

Command:

```bash
node packages/cli/dist/bin.js transform \
  packages/source-vue/fixtures/vue-router-workflow/positive \
  --profile vue-mobile \
  --out /tmp/navirox-vue-router-evidence-final.yGAq2f \
  --write \
  --json
corepack pnpm --dir /tmp/navirox-vue-router-evidence-final.yGAq2f install --ignore-scripts
corepack pnpm --dir /tmp/navirox-vue-router-evidence-final.yGAq2f test
```

Observed result:

- Transform exit code: `0`
- `ok`: `true`
- Coverage: `generated=15`, `manualRequired=0`, `excluded=0`, `refused=0`
- Workflow hash: `1447f991a19796244b05613ceb6d649775d8dd05cdde7e11429ee5c59ee4f830`
- Snapshot hash: `fc0b01aea7ad503c613263f871561bdb752642a679ce90786d8dc410cd90a4a0`
- Planned route-aware files: `generated/routes.json`, `src/router.ts`, `src/App.vue`, `src/main.ts`, and `src/native.ts`
- Generated workspace test exit code: `0`
- Generated workspace test output: `Verified 4 Vue SFCs.`
- `navirox.manifest.json` SHA-256: `994c9acb52f21614fbb7d9c8a84020f209a5f342155119a9747c4f79e64224f6`
- `generated/Home.manifest.json` SHA-256: `d344b757976a06640bac9458b34931b5e340429c819ce197aa5a4eca700a3d01`
- `generated/routes.json` SHA-256: `bee5043f97b1c821c54a6070eff659f4dee49d96accf33175c4dc6630e249d8b`

The generated route metadata contains three routes, including `/profile/:id` with parameter `id`, and four navigation actions, including concrete deep links `/profile/42` and `/settings`. The generated workspace installs `vue-router`; its verifier reads `generated/routes.json`, compares every route id with `src/router.ts`, parses and compiles every generated SFC, and checks generated event-handler linkage.

## Refusal matrix

| Construct | Finding | Result |
| --- | --- | --- |
| Computed route table or non-literal router options | `router-routes-not-literal` or `router-options-not-literal` | No route facts or workflow output |
| Non-literal route object, spread, path, name, or nested table | `router-route-not-literal`, `router-route-path-not-literal`, `router-route-name-not-literal`, or `router-route-children-not-literal` | Offending route is not emitted |
| Route guard | `router-guard-not-supported` | Route and workflow output are cleared |
| Router hook or plugin-dependent behavior | `router-plugin-not-supported` | No guessed behavior is emitted |
| Missing or unresolved component | `router-component-unresolved` | Route fact is not emitted and lowering refuses the workflow |
| Dynamic, parameterized, multi-argument, or malformed `router.push` | `unsupported-navigation-handler` | No navigation action or partial screen is emitted |
| Unsupported `RouterLink` target | `unsupported-navigation-handler` | No navigation action or partial screen is emitted |
| Any refused screen in a workflow | `incomplete-workflow` | Migration, provenance, and workspace writing are skipped |
| Profile explicitly refuses route-less workflows | `router-routes-required` | All screens are refused and no route output is emitted |

The source-vue tests cover positive routes, nested routes, route names, concrete and named navigation, multi-router route identity, guards, computed tables, unresolved components, dynamic handlers, parameterized handlers, multiple statements, and extra arguments.

## Verification

The final baseline passed with build `36/36`, tests `66/66`, typecheck `68/68`, lint clean, format check clean, dependency drift check clean, and OpenSpec all validation `65/65`. The route-specific workspace install and verifier also passed. The change was synced to the main specs and archived after validation.

## Limitations

- The generated verifier checks static SFC and route metadata validity; it does not perform a browser click journey.
- Literal route support excludes computed tables, guards, runtime plugins, dynamic navigation and unresolved components.
- Device behavior and visual proof remain T3 and T4 work, gated until this deterministic T2 evidence is accepted.
