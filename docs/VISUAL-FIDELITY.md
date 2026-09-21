# Visual fidelity gate

Navirox must not describe a migration as visually faithful merely because the
source graph, routes, data flow, or user journey match. Those are necessary
but different properties.

## Current truth

The Vue pilot proves a native Vue runtime can run a migrated business journey.
Its screens are hand-written native replacements, not output from a view
generator. It is therefore evidence for runtime viability and behaviour, not
for visual fidelity. No current adapter, including Vue, Nuxt, Angular or Next,
may claim automated visual parity or offer an image diff as a product result.

## What the product must generate

The first target-provider milestone is a generated native view tree, with a
source-location provenance record for every generated screen and component. It
must be generated from a fixed source revision without hand-written replacement
screens. A Vue-first target is the only initial scope; other source adapters
remain analysis products until this gate is passed.

The generated tree needs enough information to preserve:

- hierarchy, text, images, lists, form controls and interaction targets;
- layout constraints, spacing, colours, typography and responsive breakpoints;
- declared state variants such as loading, empty, error, selected and disabled;
- transitions and gestures, including the initial, intermediate, settled and
  interrupted states.

Unsupported CSS, browser APIs, canvas/WebGL, and dynamic code must be reported
as unresolved migration work. They must never silently become an approximate
native view.

## Reproducible visual contract

Every visual benchmark defines one or more named scenarios. A scenario pins:

1. source revision, route, fixture data and authentication state;
2. web viewport, browser engine, colour scheme, font set and reduced-motion
   setting;
3. iOS and Android device profile, OS version, font scale and colour scheme;
4. a sequence of actions and the exact capture moments;
5. masks for intentional platform chrome and declared platform-specific
   differences.

Animations are tested as time-based evidence, not a single final screenshot:

- capture at rest before the action;
- capture at the first meaningful frame, midpoint and settled frame;
- capture an interruption path when a gesture or transition can be cancelled;
- record duration and frame cadence, then fail on a tolerance breach.

Direct pixel equality between a browser page and a native application is not a
credible oracle: font rasterisation, safe areas and platform controls differ.
The comparison must instead combine a normalized layout and style measurement,
state assertions, and screenshot review with explicitly declared tolerances.
Exact pixel diffs are reserved for the same platform, device profile and
renderer across regressions.

## Release gates

| Gate | Required evidence                                                                                  | Current state                                                                                                                                                                                                                                                                                                                                                              |
| ---- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V0   | Generated target view tree with source provenance                                                  | In progress: the narrow Vue compiler emits a provenance manifest, verified on the records fixture; no eligible real screen yet                                                                                                                                                                                                                                             |
| V1   | Reproducible web and native capture harness                                                        | Complete: the web capture and the native capture driver are verified on the records fixture. The driver builds and installs the screen the target compiler emitted on the declared device profile, drives the scenario declared actions, and records the device profile and the compiler manifest hash beside every capture. See `docs/evidence/records-native-capture.md` |
| V2   | One Vue scenario passes states, layout/style tolerances and motion frames on iOS and Android       | Not started: the captures now exist on a device, but no scenario declares a cross-platform tolerance, so the comparison stays a measurement and is reported as an undeclared difference rather than a pass                                                                                                                                                                 |
| V3   | A public external Vue repository passes the same scenario without hand-written screen replacements | Not started                                                                                                                                                                                                                                                                                                                                                                |
| V4   | A supported adapter has versioned visual evidence and documented exclusions                        | Not started                                                                                                                                                                                                                                                                                                                                                                |

Only at V2 may Navirox say that a specific Vue scenario has measured visual
fidelity. Only at V4 may it make a scoped visual-fidelity claim for an adapter.

## Execution order

1. Define a framework-neutral target view IR with source provenance and explicit
   unsupported nodes.
2. Implement the Vue-to-native target provider for a narrow component subset:
   text, view, image, pressable, scroll/list, input and CSS layout/style tokens.
3. Generate the existing Vue pilot from its web source, with no replacement
   views committed alongside the output.
4. Add deterministic web and iOS/Android capture runners, fixture seeding and
   animation-frame capture.
5. Add tolerance measurement, artifact publishing and a human review report.
6. Repeat on an external Vue repository before extending the generator to Nuxt,
   Angular or Next.
