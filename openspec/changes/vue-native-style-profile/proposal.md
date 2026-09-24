## Why

The Vue lowering currently writes empty layout, style and resource fields, and the neutral target does not consume them. Without a closed style profile, T3 behavior can be tested but T4 visual structure cannot be measured or safely refused. Style support must be bounded and explicit before visual evidence is opened.

## What Changes

- Define a closed framework-neutral style and layout profile for flex layout, dimensions, spacing, color, typography, images and variants.
- Lower supported Vue style and template facts into Workflow IR style and layout records.
- Emit style data from the target through the IR, never by reading the source SFC.
- Refuse cascades, pseudo-classes, media queries, dynamic CSS and unsupported properties with source locations.
- Add positive, boundary, refusal and determinism fixtures for the exact profile.

This change does not claim visual fidelity or T4 pass. It only produces the typed data required for a later visual benchmark.

## Capabilities

### New Capabilities

- `vue-native-style-profile`: the closed Vue style and layout subset carried by the generated workflow.

### Modified Capabilities

- `workflow-ir`: style and layout records have explicit neutral value semantics and provenance.
- `source-vue`: supported style facts are lowered and unsupported constructs are refused.

## Impact

- Affects `packages/source-vue`, `packages/workflow` and `packages/target-native`.
- Adds no CSS framework, renderer or external service.
- Requires target/workspace verification and explicit refusal tests before device or visual work.
