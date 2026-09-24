## Context

See `proposal.md` - Why. `compileAngularComponent` already translates literal
fields, `signal(...)`, `computed(...)` and simple methods on a component class,
and refuses `inject(` via `CLASS_UNSUPPORTED` in
`packages/target-angular/src/index.ts`. The authorized proof fixture uses a
single field `readonly workflow = inject(RecordWorkflowService)` whose service
holds the workflow signals and methods the template binds
(`workflow.records()`, `workflow.select(record)`, and so on). The CLI convert
path already has `ConvertInput { source, script? }` and `readScript` for the
component file only.

## Goals / Non-Goals

**Goals:**

- One bounded inject form compiles so the record-workflow component can be
  converted without hand-editing generated output.
- Missing or over-complex injectables refuse loudly with no partial screen.
- CLI convert passes injectable source beside the component script.

**Non-Goals:**

- Constructor injection, multi-provider inject, `inject` with options or
  tokens, hierarchical injectors, or providedIn beyond a readable class file.
- A general Angular DI graph, routing, RxJS services, or a second inject field
  form beyond `name = inject(Type)` on a component the translator already
  accepts.
- Changing template subset rules or provenance schema.

## Decisions

### Resolve inject from the same conversion inputs, not from runtime DI

The target never runs Angular. When the class declares `name = inject(Type)`,
the translator resolves `Type` from an injectable-source map the caller
provides (CLI: read the import path next to the component). The injectable
class goes through the existing `stateFor` translator.

Rejected: emitting a host service import the native runtime would instantiate.
The native runtime is Vue; there is no Angular injector to satisfy.

Rejected: inlining a hand-written copy of the service into the SFC. That would
bypass the closed translator and violate the runnability proof's "no manual
rewrite of generated output" rule.

### Nest inject state under the inject field name

For `workflow = inject(RecordWorkflowService)`, emit a `reactive` (or plain
object of refs accessed consistently) object named `workflow` whose keys are
the translated signals, fields and methods. Template rewrites
`workflow.member()` to the Vue form for a nested ref (same rule as top-level
signals: call form drops for signal reads; methods stay calls).

Rejected: flattening every service member onto the component setup scope. It
collides with component members and loses the provenance of which identifier
came from which inject field.

### Refuse rather than partially translate an inject target

If `Type` is unreadable, missing from the map, or hits any `CLASS_UNSUPPORTED`
pattern, the whole component returns findings and no `code`, same as an
unsupported component class today.

Rejected: translating the component shell and omitting the inject members.
That is a screen that fails at runtime.

### Contract change questions

No shared contract changes. No graph concept is added, no schema version moves,
no public `@memolabs-apps/*` type name is added or re-exported, and no source
adapter or runtime seam is touched. The need is demonstrated by the real
fixture component (`record-workflow`) and the open runnability change's device
proof target.

## Risks / Trade-offs

- Nested reactive unwrap differs from top-level `ref` emission -> cover with
  unit tests that compile the fixture-shaped inject and assert the emitted
  setup block and rewritten template bindings.
- CLI must map import specifier to file path for relative Angular imports ->
  limit to relative paths already readable through `readText`/`readScript`;
  anything else refuses.
- Two parser passes (component + injectable) -> reuse `classBody`/`stateFor`
  without a second grammar; a failed injectable reuses `refusedComponent`.
