## Context

`packages/target-vue/src/index.ts` reads the template twice. `readNodes` builds the
provenance nodes and collects findings, and `renderNodes` writes the native source.
`readNodes` skips every child that is not an element (`if (node.type !== NodeTypes.ELEMENT) continue`),
so text and interpolation children are never inspected, while `renderNodes` copies
their source verbatim. A probe of the built compiler shows the result:
`<button class="row" @click="select()">Alpha</button>` becomes
`<pressable class="row" @press="select()">Alpha</pressable>` with zero findings, and
on a device React Native throws `Text string "Alpha" must be rendered inside a
<Text>` at mount. See `proposal.md` for why this must be refused.

`compileVueTarget` already returns early, with no generated source and no
`outputPath`, as soon as `findings` is non-empty, so a new finding is enough to
refuse the screen.

## Goals / Non-Goals

**Goals:**

- Refuse text native cannot render, with a finding that names the element and the
  source location, and generate nothing for that screen.
- Keep every template that is valid today valid, including the whitespace between
  elements in a multi-line template.
- Prove the records fixture still compiles to the same emitted file and the same
  manifest.

**Non-Goals:**

- No attempt to render such text by wrapping it in a text primitive.
- No new native primitive, no style or CSS change, no change to the provenance
  manifest shape, and no change to any neutral contract.
- No change to the source adapters, the App Graph, the inspection report or the
  migration tooling.

## Decisions

**1. Refuse rather than wrap the text in a text element.** A wrapper would have to
carry the styles of the element it was moved out of, and the compiler cannot split a
class between the container and the label: the fixture's `.row-button` sets layout
and typography together, so a wrapped screen would look generated while being styled
wrongly. The design forbids an unsupported construct looking migrated. Rejected:
wrapping the text in a generated `text` element that keeps the parent class (applies
container styles to the label), and wrapping it with no class (silently drops the
label's styling).

**2. A finding, not a silent drop.** Dropping the text would generate a screen that
compiles and runs but has no labels. Rejected: dropping the node with an info
finding, because a generated screen would still be returned and would look complete.

**3. Whitespace-only text is not text.** Every multi-line template has newlines and
indentation between elements, so refusing those would refuse almost every real
screen. Only a text node with non-whitespace content, or an interpolation, is
refused.

**4. A new capability, `vue-target-subset`.** The rule is about which constructs the
compiler accepts, not about the provenance manifest and the fixture contract that
`vue-target-provenance` describes. The new code is added to the target provider's
own `TargetFinding` union.

## Contract change questions

No shared contract changes. The four questions of
`docs/repositioning/AGENT-GUIDE.md` section 12:

- Why the current contract is insufficient: it is not. The finding codes live in
  `VueTargetReport`, the target provider's own report type.
- Which real consumer demonstrated the need: the native capture work, which found
  the emitted screen crashing on a simulator.
- Why provider owned metadata is not enough: not applicable, no neutral contract is
  involved.
- Whether the schema version changes: no. `TARGET_VIEW_SCHEMA_VERSION` and
  `TARGET_PROVENANCE_SCHEMA_VERSION` stay at 1 because the manifest shape and the
  node shape do not change, and only the set of finding codes grows.

## Risks / Trade-offs

- [A web template that renders a label inside a button is now refused, so a real
  screen can fail where it previously produced a crashing screen] -> The failure is
  the intended behaviour and names the element; the fix in the source is one `<span>`,
  which the records fixture already shows.
- [A whitespace check that is too strict would refuse valid templates] -> The check
  tests the trimmed content, and there are tests for a multi-line template and for an
  interpolation, plus the fixture byte-identity test that would fail on any
  over-refusal.
- [The compiler and the committed fixture could drift] -> The fixture test recompiles
  the web source and compares bytes and the manifest hash, so a refusal shows up as a
  test failure rather than as a stale committed file.
