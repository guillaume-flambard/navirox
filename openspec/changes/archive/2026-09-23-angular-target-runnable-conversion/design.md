## Context

See `proposal.md` - Why. `target-angular` compiles a template to the native
surface but emits no script, so the screen is not runnable. The Angular v22
documentation is the source of truth for the syntax: control flow
(`/guide/templates/control-flow`) defines `@if`/`@else if`/`@else` and
`@for (item of items; track ...)` with contextual variables `$index`, `$first`,
`$last`, `$even`, `$odd` and an optional `@empty`; binding
(`/guide/templates/binding`) defines `[prop]`, `[attr.x]`, `[class.x]`,
`[style.x]`, and `{{ }}`; pipes (`/guide/templates/pipes`) use `|`.

## Goals / Non-Goals

**Goals:**

- A converted screen that runs, because its bindings resolve.
- The control-flow blocks the docs define, translated.
- An end-to-end proof on a real pinned component.

**Non-Goals:**

- A general Angular compiler: dependency injection, decorators, lifecycle hooks,
  RxJS, routing, forms, `@switch`, `@defer`, pipes, content projection.
- Any public promise beyond the proven subset.

## Decisions

### A component entry point, not a template entry point

The target gains `compileAngularComponent({ template, script, filename,
outputPath })`. The template half is the existing compiler; the script half is a
bounded translator. The CLI passes the component's source beside its template.

Rejected: inferring the state from the template. A binding name with no declared
value cannot be distinguished from a typo, and guessing would emit a screen that
fails at runtime.

### The script translator is a small, closed set

It translates plain fields with literal initialisers, `signal(...)` fields, and
methods whose bodies are a supported subset; it refuses a class using anything
else (constructor DI, decorators, lifecycle hooks, RxJS) with a finding.

Rejected: emitting the class unchanged. The native runtime is Vue, so an Angular
class would not bind.

### Control-flow blocks are rewritten before parsing

`@if`/`@for` are not HTML, so the compiler rewrites the block syntax into the
equivalent native directives over a small block parser, and refuses `@switch`
and `@defer`.

Rejected: leaving them refused. They are the documented default and the most
common constructs in a real component.

### Contract change questions

No shared contract changes. No graph concept is added, no schema version moves,
no public `@memolabs-apps/*` type name is added or re-exported, and no source
adapter or runtime seam is touched.

## Risks / Trade-offs

- The translator is small, so many components are refused -> that is deliberate,
  reported with a finding, and the subset can grow behind the same tests.
- A block parser is a second parser beside the HTML one -> it is covered by tests
  for `@if`, `@else if`, `@else`, `@for`, `@empty` and the refusals.
