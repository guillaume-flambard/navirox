# Angular: the model against a framework that agrees with nothing

This records the answer to the question the change exists for, rather than a
description of the change. Angular was chosen because it disagrees with the four
existing adapters about three things at once: where structure comes from, where
state comes from, and where routing comes from.

## The question, and the answer

**Did the App Graph or the neutral core need anything new to accommodate Angular?**

No. The graph schema is still version 1, no new node kind was introduced, no
concept entered the neutral packages, and the cross-adapter gate holds the Angular
report and the Vue report to the same shape: the same node collections, the same
unit kinds, the same keys on a unit node, the same dependency node keys, and the
same capability vocabulary.

That is the strongest statement this repository can currently make about its
abstraction, and it is the statement the gate was built to produce.

## How Angular disagrees, and what the adapter does about it

| Angular does this differently | The reading |
| ----------------------------- | ----------- |
| Structure comes from decorators, not from a file format or a directory | The decorator decides, not the file name. A file named `user.component.ts` that declares no component is not a component, because Angular's own compiler would agree with the decorator. |
| State comes from what a class holds, not from a store library | An injectable that holds reactive state is a state module, one that holds none is a utility. This is a judgement, and it is recorded as one: reporting every service as a utility would have hidden the state a migration has to carry. |
| Routing is TypeScript, not a directory | Top level `path` literals in a routes file become routes. Children and `loadChildren` are findings, because resolving them means evaluating a configuration that a guard or a redirect can change. |
| Templates may live in another file | Whether a template is inline is read; an external template is a finding naming the file. |
| Older applications are assembled by modules | A module declaration is a finding. The adapter reads the standalone era and says so. |

## The gate was shown to fail

Removing the network call from the Angular fixture's API service makes the
comparison test fail, naming the missing capability rather than passing quietly.
The mirror is what the gate compares, so a divergence shows up as a missing kind or
capability rather than as an edited assertion.

## What is read, on the mirrored fixture

```
capabilities: geolocation:invoke, local-storage:read, local-storage:unknown,
              local-storage:write, network-request:invoke
unit kinds:   component, state-module, utility
routes:       /, /about, /blog/:slug
```

The same five capabilities and the same three unit kinds the Vue and Svelte
fixtures produce, which is the comparison that matters.

## What this does not prove

- No real Angular project was inspected. There is none on this machine, and the
  evidence rests on a fixture written to mirror the others.
- Templates are not parsed, so a capability used only inside a template is not in
  the reading. Stated as a limit rather than solved.
- Modules, nested routes, lazy loading, signals semantics, RxJS, forms and
  Material are all out of scope, and each is reported as a finding rather than
  guessed.
