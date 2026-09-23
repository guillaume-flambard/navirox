## Context

See `proposal.md` - Why. The compiler maps template tags to six native
primitives through the `TAGS` table and walks the template in `readNodes` and
`renderNodes`. Only the mapping table changes; the walk, the text rule and the
style validation stay as they are.

## Goals / Non-Goals

**Goals:**

- Broaden the accepted presentational element set so more real screens compile.
- Keep every refusal honest: an unmapped element still produces a finding.

**Non-Goals:**

- A new native primitive, a new directive, or a new style property.
- Any runtime, adapter or schema change, or a second target.

## Decisions

### Extend the mapping table only

Add entries to `TAGS` for presentational elements that render with an existing
primitive: inline text elements become `text`, and presentational containers
become `view`.

Rejected: a new `link` or `list` primitive, which the native renderer has not
demonstrated. Rejected: mapping behavioural elements (`<form>`, `<select>`,
`<details>`, `<dialog>`, `<a href>`) to a primitive, which would hide the browser
behaviour they lose.

### Keep the text rule unchanged

Text directly inside a non-text primitive stays refused. The native renderer
renders a string only inside a text primitive, so a `<button>Save</button>` is
still refused and the author wraps the label in a text element.

Rejected: allowing text inside `pressable`, which would generate a screen that
mounts and then throws.

### Contract change questions

No shared contract changes. No graph concept is added, no schema version moves,
no public `@memolabs-apps/*` type name is added or re-exported, and no source
adapter or runtime seam is touched.

## Risks / Trade-offs

- A wrong mapping would generate a screen that renders differently -> the
  extension stays inside the six proven primitives and each new tag is covered by
  a compiler test.
- The accepted set could drift from the documentation -> the compiler tests
  enumerate the mapping, so a change to it is a test change.
