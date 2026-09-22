## Why

The Vue target compiler accepts text that native cannot render and then emits it. A
probe of the built compiler shows `<button class="row" @click="select()">Alpha</button>`
producing `<pressable class="row" @press="select()">Alpha</pressable>` with zero
findings, and on a device React Native throws `Text string "Alpha" must be rendered
inside a <Text>` at mount. The compiler's own contract says an unsupported construct
produces findings and no generated source, so this is a fail-closed violation: the
screen looks generated and crashes instead of being refused. The native capture work
found it on a simulator, which is why the records fixture now uses a `<span>`.

## What Changes

- The Vue target compiler refuses text or interpolation placed directly inside an
  element whose native primitive is not a text primitive, with a new
  `unsupported-text` finding.
- A refusal emits no generated source and no output path, exactly as every other
  finding already does, so nothing else in the emission path changes.
- Whitespace-only text nodes stay accepted, because every multi-line template has
  them between elements.
- Tests cover the refusal, the accepted controls (text inside a text element, a
  multi-line template, nested elements) and the byte-identical regeneration of the
  records fixture.
- `docs/evidence/records-native-capture.md` records that the construct found on the
  device is now refused by the compiler instead of emitted.

## Capabilities

### New Capabilities

- `vue-target-subset`: what the Vue target compiler accepts and refuses, and the
  guarantee that a refused screen produces no generated source.

### Modified Capabilities

None.

## Impact

- Layer: target provider, per `docs/repositioning/AGENT-GUIDE.md` section 4.
  Framework knowledge stays inside `@memolabs-apps/target-vue`.
- `packages/target-vue/src/index.ts` (the `unsupported-text` finding) and its tests.
- `docs/evidence/records-native-capture.md` (the compiler-gap paragraph).
- No shared contract changes. The finding codes live in the target provider's own
  `VueTargetReport`; the App Graph, the inspection report, the source adapter
  contract and the provenance manifest shape are untouched, and both target schema
  versions stay at 1.
- The records fixture keeps its current source; it is recompiled to prove the
  emitted file and the manifest are unchanged.
