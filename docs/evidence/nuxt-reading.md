# The Nuxt reading

> **Superseded in part.** This reading predates the change that taught the
> adapters to report application modules as units (`application-module-units`,
> see `docs/evidence/application-module-reading.md`). The unit counts below are
> lower than what the same project reports today, and Nuxt's own composable rule
> is gone because the base adapter now reports those modules; every other
> conclusion holds.

This records what a Nuxt project reports through `navirox inspect`, taken from the
adapter's own fixture and from the command line.

## Commission

```
node packages/cli/dist/bin.js inspect -C packages/source-nuxt/fixtures/nuxt-app
```

## The reading, verbatim

```
Navirox inspection
  project   packages/source-nuxt/fixtures/nuxt-app
  adapter   Nuxt (experimental)
  framework nuxt ^4.0.0

Found
  files        14
  units        10 (7 component, 1 layout, 1 state-module, 1 utility)
  capabilities 1
  dependencies 3
  routes       5

Findings (4)
  info    nuxt-middleware       src/middleware/auth.ts
  info    nuxt-plugin           src/plugins/analytics.ts
  info    nuxt-runtime-config   nuxt.config.ts
  info    nuxt-server-code      src/server/api/rows.ts
```

Taking this reading from the command line rather than from a unit test found a
defect the test could not: the descriptor reported `framework nuxt ^3.5.43`, which
is the Vue range inherited from the base adapter's descriptor. The adapter now
replaces that field instead of inheriting it, because publishing one framework's
version under another framework's name is the kind of quiet untruth this report
exists to avoid. The assertion that would have caught it is in the adapter's own
tests.

## What is read

The Nuxt adapter composes the Vue adapter and adds what Nuxt adds. On the fixture
that means:

| Read                | Where it comes from | Example                                            |
| ------------------- | ------------------- | -------------------------------------------------- |
| Components          | the Vue adapter     | `src/pages/index.vue`, `src/components/List.vue`    |
| State modules       | the Vue adapter     | `src/stores/counter.ts`                             |
| Capability use      | the neutral scan    | `network-request:invoke` from `useFetch`            |
| Dependencies        | manifest reading    | `nuxt`, `pinia`, `vue` with their declared ranges   |
| Routes              | the pages directory | `/`, `/about`, `/blog`, `/blog/:slug`, `/docs/:lang` |
| Layouts             | the layouts directory | `layout:src/layouts/default.vue`                  |
| Composables         | the composables directory | `utility:src/composables/useRows.ts`          |

Every identifier in the fragment begins with `nuxt:`, including for the units the
Vue adapter read, because the fragment is what this adapter produced.

## What is refused, and reported

| Reported as            | File                              |
| ---------------------- | --------------------------------- |
| `nuxt-server-code`     | `src/server/api/rows.ts`          |
| `nuxt-plugin`          | `src/plugins/analytics.ts`        |
| `nuxt-middleware`      | `src/middleware/auth.ts`          |
| `nuxt-runtime-config`  | `nuxt.config.ts`                  |

None of them becomes a unit or a route. The server side is a different runtime
and this adapter has no reading of it, so the report says so instead of producing
a route count that quietly excludes it.

## The version check belongs to this adapter

The base adapter checks Vue's range, which is not Nuxt's claim. A project that
declares a Nuxt major outside the tested ranges gets a `version-untested` finding
from this adapter, and the base adapter's "Vue is not declared" warning is dropped
for a Nuxt project, because Nuxt provides Vue and the warning would be a false
statement about the project.

## What moved into the neutral core

`declaredMajor` and `testedMajors`, the reading of a declared version range, moved
from the adapters into `@navirox/source` at the third copy. Reading a range is
neutral: every adapter needs the same answer to decide whether it was tested
against what a project declares.

## What this does not prove

- No real Nuxt project was inspected. The reading above is from the adapter's own
  fixture; there is no Nuxt application on this machine, and none is claimed.
- Nuxt 2 semantics are not read. The adapter declares the majors it was tested
  against, and a project outside them is a finding.
- Nothing was migrated. No classification, no transform, no target.
