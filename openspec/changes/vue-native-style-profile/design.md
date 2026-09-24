## Context

The current Vue lowering preserves only a conservative text and class subset, while the target emits default styling. The source adapter can read static SFC style blocks and scope metadata, but the workflow has no explicit style contract. The native style work must not claim that arbitrary web CSS is portable, and dynamic bindings cannot be evaluated safely in this slice.

## Goals / Non-Goals

**Goals:**

- Preserve static selectors, declarations, tokens and source locations as neutral facts.
- Define an explicit native style profile for the supported visual subset.
- Record any source-selector rewrite with both forms and a reason.
- Refuse dynamic, unresolved and unsupported visual behavior atomically.

**Non-Goals:**

- No arbitrary CSS-to-native visual equivalence.
- No browser layout engine, pixel-perfect comparison or cross-platform renderer claim.
- No source-scoped selector rewrite beyond the declared profile.

## Decisions

### Keep source facts and target capabilities separate

The Vue adapter will read source style blocks and bindings and emit neutral style facts. The target will consume a separately named style profile. The workflow will not contain Vue SFC metadata or target CSS implementation details.

### Refuse dynamic visual behavior

A binding that cannot be resolved to a literal value will be refused. The adapter will not turn runtime expressions into guesses, and the target will not silently ignore a selector or pseudo-state it cannot render.

### Record selector rewrites

If a supported source selector needs a declared native rewrite, both the original and rewritten selector will be stored with the source location and reason. Unrecorded rewriting is prohibited.

### Make the profile visible

The manifest will name the style profile and the supported feature list. Repeated runs with the same source and profile will produce the same style output.

## Risks / Trade-offs

- [The supported visual subset is smaller than web CSS] -> Publish the exact profile and refuse unsupported constructs.
- [Native appearance may differ from web] -> Keep the style profile explicit and do not claim pixel equivalence.
- [Style findings can be easy to hide in a mixed run] -> Apply the all-or-nothing transform contract and surface every finding.

## Migration Plan

1. Add static and dynamic style fixtures to the Vue adapter.
2. Add workflow style records and schema validation.
3. Add a named native style profile and generated workspace selector.
4. Add refusal and atomic rollback tests.
5. Run the full baseline and record the supported profile before device proof.
