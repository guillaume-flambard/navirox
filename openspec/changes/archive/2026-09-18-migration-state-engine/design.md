## Context

Everything up to now reads. The planner decides, and the decide step was built to
refuse rather than to guess. Writing is different in kind: a wrong read costs
nothing, a wrong write costs somebody's afternoon, and the repository has no
mechanism at all for undoing one.

The pieces that exist are the right pieces for this: the plan is deterministic,
every decision carries a reason, and compatibility facts are recorded. The gap is
an engine, a record of what it did, and a way back.

## Goals / Non-Goals

**Goals:**

- A versioned state file that survives between runs and says what was done and
  from which source content.
- One transform that is honestly safe: the units the plan classified as `shared`
  are copied unchanged into an output directory.
- A dry run that is the default, an explicit write, an idempotent second run, and
  a rollback that restores what a failed run touched.
- A refusal to write anywhere but the output directory, and a refusal to run in
  place.

**Non-Goals:**

- Rewriting framework code. That needs a source transform per framework and a
  proof that the rewrite preserves behaviour, and neither exists.
- Generating native screens or a native project. The output directory is a
  destination, not a scaffold.
- Resolving imports, rewriting paths, or updating a build configuration. The first
  transform moves files that need none of it, because they are logic with no
  platform dependency.
- A hosted or resumable-in-the-cloud story. The state file is local.

## Decisions

**Dry run is the default and writing is explicit.** A tool that writes into
somebody's project by default is a tool nobody should run, and the cost of the
flag is one word. Alternative rejected: writing by default with a `--dry-run`
escape, which inverts the safe direction for the convenience of the author rather
than the safety of the user.

**The state records a fingerprint of the source content, not a timestamp.** A
timestamp cannot answer whether the thing it describes is still the thing it
described. A hash of the unit's content can, and it is what makes a second run a
no-op instead of a duplicate. Alternative rejected: recording "done" per unit with
no content identity, which would silently skip a unit that has since changed.

**State is written after the files it describes, and only for what completed.**
The ordering is the whole guarantee: state that runs ahead of reality is worse
than no state, because the next run trusts it. Alternative rejected: writing state
first, which makes a crash produce a project that believes it is migrated.

**The rollback covers the run, not the whole history.** Every file written during a
run has its previous content held in memory, and a failure restores all of them.
Rolling back earlier runs would mean rewriting work the user has since built on,
and the safe unit of undo is the run the user just started. Alternative rejected:
per unit rollback plus an undo command, which is a bigger promise and a worse one.

**One transform, and it copies rather than rewrites.** The interesting transforms
are rewrites and they are not provable yet. Copying the `shared` units is a real
migration step, it is the only one that cannot change behaviour, and it exercises
the whole machine: selection, output paths, state, idempotence and rollback.
Alternative rejected: shipping a Vue codemod as the first transform, which would
have put an unproven rewrite behind a flag that says "write".

**The output directory is a boundary, not a convention.** Every path is resolved
and checked against it before anything is written, and the engine refuses to run
when the output would be the source. Alternative rejected: trusting the transforms
to compose safe paths, which is the bug that deletes somebody's work at three in
the morning.

Contract change questions, per AGENT-GUIDE section 12:

- Why the current arrangement is insufficient: the plan produces decisions and
  nothing consumes them; a decision with no executor is a document.
- Which real consumer demonstrated the need: the `migrate` command and the state
  file it writes.
- Why adapter owned metadata is not enough: the record of a migration is about a
  project and a target, not about a framework, and the next run must be able to
  read it without knowing which framework wrote it.
- Whether the schema version changes: the migration state is a new artifact with
  its own schema version. The App Graph and the plan schema are untouched.

## Risks / Trade-offs

- **A migration that only copies shared logic looks like very little.** It is very
  little, it is provably safe, and it establishes the machine that every later
  transform will use. The alternative is a rewrite nobody can verify.
- **Rollback keeps previous content in memory for the length of a run.** For the
  files this engine writes that is negligible, and a large project would need a
  journal on disk. Recorded as an open question rather than solved in advance.
- **The fingerprint covers the unit's own file, not the files it imports.** A unit
  whose behaviour depends on a changed neighbour is not treated as changed. This is
  a real limit, it is stated here, and it is why the first transform only copies
  content rather than adapting it.
- **A user can point the output at a directory that already contains files.** The
  engine overwrites what it writes and its rollback restores it, but it does not
  compare against an unrelated file that was already there. The state file is what
  makes the situation legible.

## Open Questions

- Whether the rollback journal belongs on disk once a transform can write a large
  number of files.
- Whether the state should record a source tree hash as well as per unit
  fingerprints, so that a run can tell that the project changed elsewhere.
