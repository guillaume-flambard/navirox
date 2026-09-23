# deterministic-transform-validation design

## Context

The migration engine runs transforms that declare the writes they want and let
the engine perform them, which is what makes a dry run and a rollback possible.
Only one transform exists, `copy-movable-unit`, and it copies byte for byte. A
transform that rewrites code changes the moved file's bytes, so it needs two
things the copy transform did not: a record of what it changed and why, and a
demonstration that the engine can still put the directory back if the run fails.

The engine already provides the reversibility machinery: it reads each target's
previous bytes into `Held {path, previous}` before overwriting and calls
`restore(held)` when anything throws. What is missing is a transform that uses
the rewrite path and proves the machinery still holds.

## Decisions

### The rewrite is one bounded, rule-driven substitution

The new transform replaces a single, syntactically discrete construct with its
native-equivalent form, and every replacement is reported. It is deterministic:
the same input always produces the same output, so two runs agree and the
fingerprint stays stable.

Rejected: a broad codemod. A transform that rewrites an open-ended construct
needs a proof this change cannot provide, and the engine's own source already
rejects that as unproven.

### Provenance is part of the transform's output, not a log

Each write carries the input, the rule that fired and the output it produced, so
the same record a reader trusts for a copy also covers a rewrite. The transform
emits this through the existing `TransformWrite` shape plus a rule identifier,
rather than writing a separate log file the engine would have to collect.

Rejected: a side-channel log. A second channel can disagree with the writes it
describes, and the engine's design keeps every fact about a run in one report.

### Reversibility is proved by a failing run, not asserted

The behavioural test forces the engine to throw after a write and asserts the
directory is back to its previous bytes, which exercises the real `restore` path
rather than a hand-built one.

Rejected: asserting reversibility from the engine's code. The repository's rule
is that tests prove claims, and an unexercised rollback path is exactly the kind
of claim the contract's task 3.4 refuses.

### Behaviour is asserted on the rewritten output

The test plans a real graph, runs the migration, and reads the written file to
assert the substitution happened and the surrounding code is intact. It does not
assert on the transform's internal branches.

Rejected: a unit test of the transform function alone. It would not prove the
engine selects, writes, records and reverses the transform.

## Contract change questions

This change adds a transform to `@memolabs-apps/migrate`, a framework-neutral
package. The contract does not change: no schema version moves, no public
`@memolabs-apps/*` type name is added or re-exported from a provider, and the
transform reads code with the neutral helpers already in `imports.ts` rather than
importing a framework compiler. Adapter metadata is insufficient here for the
same reason it is insufficient elsewhere in this package: the decision to rewrite
depends on the code, not on what an adapter declares.
