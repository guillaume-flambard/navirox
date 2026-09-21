# SuiteCRM benchmark: Angular analysis evidence

This is analysis evidence. It records what the Angular source adapter reads from a
pinned SuiteCRM revision. It is not a SuiteCRM partnership, not a migration, and not
a claim that SuiteCRM can be turned into a mobile application.

## Source revision

| Field | Value |
| --- | --- |
| Repository | https://github.com/salesagility/SuiteCRM-Core.git |
| Commit | `2cd77380bc838b8bd6c80f9fbe25855d73ef860c` |
| Source directory | `.` (repository root) |
| Adapter | `angular` |
| Framework version read | `@angular/core` `18.2.14` |

The commit is pinned in `benchmarks/catalog.json`. The benchmark protocol fetches that
exact commit (`git fetch --depth 1 origin <commit>`) and fails unless `git rev-parse HEAD`
matches it, so no branch is ever read. The checkout is read only: nothing is installed,
nothing is executed, and no file is written inside it.

`sourceDirectory` is the repository root because that is the manifest that describes the
frontend's Angular version. `core/app/core/package.json` declares `@angular/core` only as
a stale peer range (`^12.1.0`), and `core/app` carries no manifest at all.

## How this was measured

```bash
pnpm test:benchmarks -- --project suitecrm
node packages/navirox/dist/bin.js analyze /tmp/suitecrm-core --json
```

The first command is the pinned profile and exits 0 printing `suitecrm: angular, 0 routes,
0 screens`. The second produces the detailed report quoted below.

## Route and unit counts

| Measure | Count |
| --- | --- |
| Files read | 12286 |
| Units | 1588 |
| Units by kind | utility 1251, component 297, state-module 40 |
| Capabilities | 684 |
| Dependencies | 40 |
| Routes | 0 |
| Screens | 0 |
| Findings | info 198, warning 179, error 0 |

Baselines recorded in the profile: `minimumRoutes` 0, `minimumScreens` 0, `minimumUnits`
1588. The unit baseline is the regression guard that matters here, because a route count
of zero is the correct reading of this revision rather than a reading that was skipped.

## Unsupported surfaces

| Code | Count | What it means here |
| --- | --- | --- |
| `angular-external-template` | 198 | The component declares `templateUrl`. The component is reported, its template is not read. |
| `angular-module` | 177 | The revision is NgModule era. This adapter reads the standalone era and has no reading for what a module assembles. |
| `angular-remote-configuration` | 1 | `core/app/core/src/lib/services/extensions/extension-loader.service.ts` loads federated remotes (`loadRemoteModule` plus `loadChildren`). Nothing that arrives from a remote is in this reading. |
| `version-untested` | 1 | The project declares `@angular/core` 18.2.14. This adapter was tested against `^20.0.0` and `^21.0.0`, so major 18 is not covered and no support is claimed for it. |

The route count needs the same honesty. The shell route table is
`core/app/shell/src/app/app-routing.module.ts`, and it declares an empty literal array:

```ts
const routes: Routes = []
```

The real routes of this revision are registered at runtime through federated extension
loading, which is exactly the single `angular-remote-configuration` finding above. So zero
routes and zero screens are what a static reading can honestly report, and the adapter
reports the unread mechanism instead of inventing routes for it.

Only one file in the whole revision matches the `*.routes.ts` convention
(`core/app/core/src/lib/views/login/components/login/login.routes.ts`). The routing module
convention, `core/app/shell/src/app/app-routing.module.ts`, is the file the adapter had to
learn to read as a route table.

## What the adapter read

The reading that does work is the component and service surface: 1588 units, including 40
state modules, and 684 capability usages from the framework neutral vocabulary the other
adapters use (storage, network requests, geolocation and similar). That vocabulary is what
a bounded mobile companion would draw on, and it is recorded here as a count, not as a
plan.

## No claim

Nothing in this document says that SuiteCRM has been migrated, converted, endorsed or
partnered with. Nothing says a SuiteCRM screen reached visual parity with anything. The
counts cover one pinned revision read as source, and the unsupported surfaces above are
listed so that a reader can see what was not read.
