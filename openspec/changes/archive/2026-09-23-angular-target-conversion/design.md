## Context

See `proposal.md` - Why. `packages/target-vue` proves the shape: a compiler that
maps an HTML-like template to six native primitives, emits the native Symbiote
Vue single-file-component source plus a deterministic provenance manifest, and
refuses anything it cannot render in full. The Angular journey has no such
compiler today; `source-angular` only detects inline versus external templates
and never parses the HTML.

## Goals / Non-Goals

**Goals:**

- Transform a bounded Angular template into the native surface.
- Emit the same provenance manifest shape the Vue target emits.
- Refuse every construct the compiler does not implement.

**Non-Goals:**

- A general Angular template engine (pipes, `*ngSwitch`, content projection,
  `ng-template`, control flow blocks).
- Any runtime, adapter or schema change.

## Decisions

### The Angular template is tokenised as HTML, and Angular semantics are ours

An Angular template is HTML with attributes (`*ngIf`, `(click)`, `[src]`,
`[(ngModel)]`) and interpolation. The compiler parses it with
`@vue/compiler-dom`'s `parse`, used strictly as an HTML tokenizer: it returns
elements, text, interpolation and raw attribute names, and every Angular
interpretation is written here.

Rejected: adding `@angular/compiler`, which is not in the workspace and would add
an external dependency and a network install for a bounded subset. Rejected: a
hand-rolled HTML parser, which re-implements nesting, quoting and self-closing
handling that a proven tokenizer already does.

### Translation is a fixed table, not a template engine

The accepted constructs are translated one to one: an element to its primitive,
`*ngIf` to `v-if`, `*ngFor` (`let x of y`) to `v-for` (`x in y`), `(click)` to
`@press`, `[prop]` to `:prop`, and `[(ngModel)]` to `v-model` only on a
`text-input`.

Rejected: translating `[ngClass]`/`[ngStyle]`, which have no native equivalent
the renderer demonstrates; they are refused instead.

### The output is the native surface, the same one the Vue target emits

Both targets emit the native Symbiote Vue single-file-component surface, because
the target is the native surface and the source framework only changes the input
syntax.

Rejected: emitting Angular, which the runtime cannot render.

### Contract change questions

No shared contract changes. No graph concept is added, no schema version moves,
no public `@memolabs-apps/*` type name is added or re-exported, and no source
adapter or runtime seam is touched. A target provider importing a framework's
compiler follows the precedent set by `target-vue`.

## Risks / Trade-offs

- The Angular subset is small, so many real components are refused -> the refusal
  is explicit with a finding, and the subset can grow behind the same tests.
- Reusing `@vue/compiler-dom` couples the tokenizer to Vue -> it is used only as
  an HTML parser, is already a workspace dependency, and a parser change would be
  caught by the tests.
