# The Vue inspection, run against the acceptance app

> **Superseded in part.** This reading predates the change that taught the
> adapters to report application modules as units (`application-module-units`,
> see `docs/evidence/application-module-reading.md`). The unit counts below are
> lower than what the same project reports today; every other conclusion holds.

This records the first time a real project went through the source seam, and what
the reading was. It is evidence for change `vue-source-adapter`.

## Commission

```
node packages/cli/dist/bin.js inspect -C examples/vue-basic
```

## Human report

```
Navirox inspection
  project   /Users/memo/projects/active/apps/navirox/examples/vue-basic
  adapter   Vue (experimental)
  framework vue ^3.5.43

Found
  files        426
  units        5 (4 component, 1 state-module)
  capabilities 0
  dependencies 14
  routes       0

Findings
  none

Not determined
  nothing was left unresolved by this adapter

Next
  Run `navirox inspect --json` for the full graph.
```

## Machine report

`node packages/cli/dist/bin.js inspect -C examples/vue-basic --json` exits 0 and
writes one JSON document:

```
schemaVersion 1
source        {"adapterId":"vue","displayName":"Vue","frameworkVersion":"^3.5.43"}
supportLevel  experimental
summary       {"files":426,"units":5,"capabilities":0,"dependencies":14,
               "routes":0,"screens":0,"findings":{"info":0,"warning":0,"error":0}}
```

The units it found, with the identifiers it derived:

```
vue:App.vue:component:default                          (component)
vue:components/CounterControls.vue:component:default    (component)
vue:components/CounterReadout.vue:component:default     (component)
vue:components/NativePanel.vue:component:default        (component)
vue:stores/canary.ts:state-module:default               (state-module)
```

## What this proves

- Detection selected the Vue adapter from the manifest alone, and the report
  names the declared range `^3.5.43` rather than a resolved version, because
  nothing resolved it.
- An adapter the core knows nothing about produced a framework-neutral graph:
  every identifier starts with the adapter id, and the whole pipeline that
  consumed it, `@memolabs-apps/inspect`, imports no framework.
- The state module was found by its declaration and not by its import: the app
  imports Pinia in more than one place and only one module declares a store.
- No capability use was reported. That is a reading of this app, not a limit of
  the scan: the app reaches native storage through `@memolabs-apps/native` rather than
  through `localStorage`, so there was nothing for the pattern set to match.
- `examples/` was not modified: `git status --porcelain examples/` is empty.

## What this does not prove

- Routes. The app declares no router, and the adapter does not extract routes
  from one it does declare. A project that uses `vue-router` gets a finding
  saying so, and route extent stays unknown.
- Classification. No unit was judged shared, portable, adaptable or anything
  else, because the compatibility and planning layers have no facts yet and the
  adapter is forbidden from inventing them.
- Anything about a framework other than Vue. The seam is exercised by one
  adapter, and the second one is the proof that it is a seam.
