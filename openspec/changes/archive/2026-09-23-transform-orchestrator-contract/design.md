## Context

See `proposal.md` - Why. Discovery produces a hashed
`RepositoryCapabilityManifest` with an eligibility classification. The version
gate refuses an unverified framework major. `@memolabs-apps/workflow` owns the
IR. `SourceTransformProvider.lower` and `TargetProvider.emit` meet at that IR
with a static seam check. `migrate` already defaults to dry-run and writes only
inside a given output root. The CLI already owns `analyze`, `inspect`, `plan`,
`migrate` and `convert`, and `convert` already has a dry-run report shape. What
does not exist is one deep module that sequences all of those stages for
`navirox transform`.

## Goals / Non-Goals

**Goals:**

- One programmatic entry point that sequences every stage in a fixed order.
- Dry-run by default, refusal before write, and an output layout that separates
  generated, shared and manual work.
- A thin `navirox transform` CLI command that only parses arguments and prints
  the deep module's result.
- Proof with a fake source and a fake target, so the path is tested before any
  real framework lowering exists.

**Non-Goals:**

- Implementing a real Vue (or any) lowering or a real IR-driven target emission
  (those are Tranche 3).
- Promising Vue coverage, visual fidelity, public install or any framework
  support claim.
- Changing the graph, the adapter public API, the runtime seam, or the
  lowering/emission contracts.
- Ownership/regeneration of a previously generated workspace (later tranche).

## Decisions

### The deep module lives in `@memolabs-apps/cli`

`transform` is a command-shaped workflow, and the CLI is already the neutral
composition root that owns adapter registration and the existing command
implementations (`convert.ts`, `migrate` dispatch). Putting the orchestrator in
a new package would add a workspace edge without a second consumer.

Rejected: a new `@memolabs-apps/transform` package. Rejected for now: putting it
in `migrate`, whose engine is about moving units, not about sequencing discovery
through scaffold.

### One ordered pipeline, stop on first refusal

Stages run in a fixed order: discovery and eligibility, version gate, inspect and
plan, lower, emit, migrate approved units, provenance, scaffold planning. The
first refusal or error stops the run. Later stages do not run, and no write
happens. This matches the existing `migrate` engine's "hold then commit" idea
and the programme's "arrêt avant écriture en cas de refus".

Rejected: collecting refusals across stages and continuing. A later stage's
output would be based on a repository already judged ineligible.

### Dry-run is the default, write is an explicit flag

The result always describes what would be written. Filesystem mutation requires
an explicit write request, mirroring `migrate --write` and `convert`'s `write`
option. A dry run is the safe default for a command that can create a whole
workspace.

Rejected: write-by-default with `--dry-run`. The programme requires dry-run by
default for this change.

### Path safety is checked before any stage that could write

Before emission or scaffold, the orchestrator resolves `output` against `root`
and refuses when the output is inside the source root, is the source root, or
escapes via traversal. The check uses resolved paths, not string prefixes.

Rejected: relying on `migrate`'s internal `isInside` alone. That check protects
migration writes; the orchestrator must refuse before any stage, including
emission and scaffold planning.

### The fake source and fake target prove the path

Tests inject a fake discovery reader, a fake lowerer and a fake target that
satisfy the existing interfaces (`DiscoveryReader`, `SourceTransformProvider`,
`TargetProvider`). They do not import a framework. This keeps the orchestration
testable without a real framework and without widening the seam.

Rejected: proving the path only with `source-vue`. That would couple the
orchestration contract to Tranche 3 and would not be runnable today.

### Contract change questions

This change introduces one new contract (`transform-orchestrator`) and uses the
existing `repository-capability-manifest`, `adapter-version-governance`,
`workflow-ir` and `source-transform-provider-seam` contracts. It changes no
graph concept, no existing schema version and no public `@memolabs-apps/*` type
name outside the CLI package's own exports.

## Risks / Trade-offs

- The orchestrator could grow framework-shaped fields -> it only accepts
  `profile.id` and provider ids as strings; the seam types already forbid
  framework types at the boundary.
- Dry-run and write could diverge from the real write path -> the same code path
  plans the writes; only the final commit is gated on the write flag, and a test
  asserts dry-run and write produce the same planned file list.
- Path checks could miss a symlink escape -> this change refuses traversal and
  source-inside-output on resolved paths; symlink-aware refusal beyond that is
  an open follow-up, not a silent gap (recorded below).
- A fake-only proof could hide real lowerer integration -> accepted for this
  change; Tranche 3 owns the real lowering proof.

## Open Questions

- Should `navirox.manifest.json` pin the discovery `snapshotHash` and the
  workflow hash as first-class fields, or nest them under a `provenance`
  object? Both satisfy the result contract; choose when the first real manifest
  fixture is written, without changing the requirements.
- Symlink escape of `output` relative to `root`: refuse on realpath comparison
  in this change, or defer to the workspace-ownership change? Default for
  tasks: check resolved paths now; defer symlink-specific handling only if a
  fixture proves it needs its own decision.
