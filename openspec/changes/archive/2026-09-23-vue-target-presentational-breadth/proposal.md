## Why

The Vue target accepts a small element set: only a handful of container and
inline tags map to the six native primitives. Common presentational tags
(`<aside>`, `<figure>`, `<ol>`, `<b>`, `<code>`, `<time>`, and more) have no
mapping, so a real screen is refused even when every construct in it is
renderable. This change broadens the accepted presentational set without adding
a primitive or weakening the refusal rules.

## What Changes

- Map the documented presentational elements to the existing `view` and `text`
  primitives.
- Keep the text rule unchanged: text directly inside a non-text primitive is
  still refused with a finding.
- Add no primitive, no directive and no style property.

## Capabilities

### New Capabilities

None: this extends an existing capability.

### Modified Capabilities

- `vue-target-subset`: the accepted presentational element set is extended; the
  text-refusal rule is unchanged.

## Impact

This touches `@memolabs-apps/target-vue` only. It changes no package boundary, no
public `@memolabs-apps/*` type name, no schema version, no source adapter, no
runtime seam and no native primitive. It does not claim a new construct the
native renderer has not already demonstrated.
