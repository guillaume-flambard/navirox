## Context

See `proposal.md` - Why. `packages/cli/src/convert.ts` imports the Vue target
directly and calls `compileVueTarget`. `@memolabs-apps/target-angular` now exists
and compiles an Angular template into the same native surface. The Angular source
adapter carries only `{ inlineTemplate, externalTemplate }` on a component unit
and reports `angular-external-template` rather than reading the template.

## Goals / Non-Goals

**Goals:**

- Select the target from the source adapter.
- Read an Angular component's template so the Angular target has input.
- Refuse a screen whose template cannot be read.

**Non-Goals:**

- A general Angular template resolution (pipes, imports, content projection).
- Any source-adapter or runtime change.

## Decisions

### The target is an injected seam in the conversion

`runConversion` takes a `target` object `{ id, compile }` and never imports a
target package. The CLI builds the target from the adapter id.

Rejected: importing both targets inside `runConversion`, which would couple the
conversion logic to the two providers and make it untestable without them.

### The target is chosen by the adapter id

The command maps `angular` to `@memolabs-apps/target-angular` and every other
adapter to `@memolabs-apps/target-vue`.

Rejected: a `--target` flag, which would let a user pair a target with a source
it cannot compile.

### The Angular template is read from the component, in the CLI

For an Angular screen, the command extracts the inline `template:` string or
reads the `templateUrl` file, relative to the component. When neither is
readable, the screen is refused with a finding.

Rejected: waiting for the source adapter to carry the template, which would widen
the adapter's graph and spec for a need only the convert command has today.

### Contract change questions

No shared contract changes. No graph concept is added, no schema version moves,
no public `@memolabs-apps/*` type name is added or re-exported, and no source
adapter or runtime seam is touched.

## Risks / Trade-offs

- A regex that reads the wrong `template:` string could compile the wrong source
  -> the reader is covered by tests for inline, external and unreadable cases.
- An Angular component whose template uses an unsupported construct is refused
  -> that is the honest outcome, reported with the finding.
