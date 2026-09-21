## Context

The current target compiler reads a Vue SFC directly and refuses output when an
element, directive or CSS construct is outside the explicit safe subset. Its output
has no generated-screen manifest, no runnable generated application and no capture
contract. `docs/VISUAL-FIDELITY.md` defines V0 through V4 and requires a target
view tree with source provenance before any visual claim.

The product needs two separate truths. A fixture may pass a measured scenario,
which advances V0 to V2 for that fixture. An external repository may still fail
because of RouterLink, selectors, dynamic data or unsupported CSS. The report must
keep those outcomes separate.

## Design

### Generated screen boundary

`@memolabs-apps/target-vue` remains a target package. It MUST not be imported by
a source adapter, and it MUST not introduce a framework concept into the neutral
App Graph. It emits:

- generated Vue-native source only for a fully supported input;
- a JSON provenance manifest with source revision or fixture identity, input path,
  every generated node's source location, compiler version and findings;
- no source file when findings exist.

The generated fixture application consumes exactly the generated file at its emitted
path. A test hashes the generated source and compares it with the compiler output,
so a replacement screen cannot be substituted later.

### Visual benchmark boundary

A scenario is JSON or TypeScript data, not an unstructured test description. It
pins the route, fixture data, browser viewport, device profile, colour scheme,
font scale, reduced-motion setting, ordered actions, capture moments and allowed
masks. Capture output is versioned by scenario name and platform, but binary image
artifacts are ignored by Git and retained by CI or a local report directory.

Comparison computes normalized layout and style measurements before screenshot
review. Browser chrome, safe areas and declared native controls are maskable only
when the scenario lists the mask. An undeclared difference fails the scenario.
Motion requires rest, first meaningful frame, midpoint and settled captures.
Interruption is required only for an interruptible scenario.

### Baserow diagnostic

The pinned Baserow benchmark is analyzed but never emitted as an app by this
change. The report lists source paths, findings and a count by blocker code. The
document calls it a diagnostic, not a converted screen.

## Rejected alternatives

- Pixel equality across browser and native platforms: rejected because fonts,
  safe areas and platform controls produce expected renderer differences.
- Hand-authored native fixture: rejected because it proves the runtime, not the
  target compiler.
- Extending the App Graph with Vue template syntax: rejected because no second
  source adapter needs it and the target package can own its own input details.
- Starting with Baserow output: rejected because the target would either fail
  truthfully or pressure the implementation into hidden approximation.

## Contract change questions

No shared contract changes. The current neutral contracts are sufficient because
the provenance manifest belongs to the Vue target output, not the App Graph.
The real target provider demonstrated the need; adapter metadata cannot represent
generated native nodes; no shared schema version changes.

