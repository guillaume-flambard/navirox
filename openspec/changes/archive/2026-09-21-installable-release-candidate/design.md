## Context

Issue #15 has to answer a question the version tags do not: can someone outside
this repository install the product and use it? Three facts shape the answer.

The `0.1.0` tags do not identify the code that ships today. The bare `0.1.0` and
`create-navirox@0.1.0` tags point at the commit whose packages were still named
`@navirox/*`. The 29 `@memolabs-apps/*@0.1.0` tags and the `candidates/*` tags
point at the rename commit, five commits behind `HEAD`. Neither tag names the
commit that carries the migration work or the native pilot.

The registry carries most of the release, not all of it. Twenty six of the twentynine
publishable workspaces resolve at `0.1.0`; `@memolabs-apps/cli`,
`@memolabs-apps/source-lit` and `@memolabs-apps/source-solid` return 404. The CLI
is the package a user installs first, so the public entry point is missing.

The scaffolder cannot produce an installable app outside a checkout. When it
finds no `pnpm-workspace.yaml` above itself it writes `0.0.0` for the five
`@memolabs-apps/*` entries. The end-to-end scaffold script never caught this
because it rewrites those entries to `file:` tarball paths and adds `overrides`
before installing, so the placeholder never reached a package manager.

## Goals / Non-Goals

**Goals:**

- One candidate: every publishable workspace at one version, packed from one
  commit, with the commit tagged so the artifacts and the evidence name it.
- The scaffolder writes something that installs. A user who runs
  `npm create navirox` and then `pnpm install` against a complete registry must
  get a working app, not five unresolvable ranges.
- The artifacts are exercised outside the workspace: install into a clean
  directory, then run scaffold, `doctor`, `inspect`, `plan` and `migrate` from
  what the install produced.
- The notes match the code. Prerequisites, what is automated, what stays manual,
  the publication sequence and the check that follows publication.

**Non-Goals:**

- Publication. Issue #17 owns it and it needs an interactive security-key step.
  This issue prepares the candidate and writes the sequence down.
- Wiring the pilot journey into CI. The canary journey already gives per-commit
  native evidence on both platforms; a pilot job is a follow-up.
- Any behaviour change in a runtime, adapter, planner, migration or
  compatibility package beyond the version their manifest carries.
- Making `@memolabs-apps/*` dependency ranges float. They are pinned exactly
  because the version lines move independently.

## Decisions

**The candidate is `0.1.1`, not a second `0.1.0`.** npm already owns `0.1.0` for
twenty six packages from the rename commit, and the registry will not accept a
different artifact under a version it already holds. A changeset naming every
publishable workspace moves all of them to `0.1.1` together, which also means a
`0.1.1` install cannot mix code from two revisions.
Alternative rejected: keeping `0.1.0` and publishing only the three missing
packages. It is cheaper, but the pilot and the migration engine would stay
unreleased while the registry claimed one version held two different codebases.

**The scaffolder writes the version it was released as.** `create-navirox` reads
its own package manifest at runtime and uses that version for the five
`@memolabs-apps/*` entries when it finds no checkout. One version covers the
whole set because the release moves the set together, so reading it from the
scaffolder's own manifest is the same number the other packages carry.
Alternative rejected: a caret range. The published manifests pin their Navirox
dependencies exactly, and a range would let a pre-alpha app pick up a later
patch whose contract it was never tested against.

**The `link:` branch stays.** Inside the repository a checkout is the honest
answer: the packages are not published in full, and a link consumes the built
workspace the way an example app already does. The change is limited to the
branch that has to stand on its own.

**The candidate is validated from tarballs, and that is stated.** A clean
directory outside the workspace with every archive installed is reproducible
today; a registry install is only possible once issue #17 completes. The notes
say which one the evidence used, and the publication sequence ends with the
registry check that would make the other one true.

**The native evidence for this candidate is the CI journey of the candidate
commit.** The canary runs the shared journey on a simulator and an emulator for
every push to `main`. Recording that run against the candidate commit is
evidence about the exact revision the artifacts were packed from, and it avoids
re-running two platform suites by hand for a version bump that changes one
source file.
Alternative rejected: re-running the pilot journey locally for the candidate. It
adds hours and proves the same revision twice.

## Contract change questions, per AGENT-GUIDE section 12

No shared contract changes. The App Graph, the migration state schema, the
planner classes, the runtime seam and the public component surface all stay as
they are. The questions therefore do not apply, except for the scaffolder's
manifest output, which is a user-facing file rather than a shared contract:

- Why the current behaviour is insufficient: it writes `0.0.0`, which no package
  manager can resolve outside a checkout.
- Which real target demonstrated it: a scaffolded app with no checkout above it,
  which is the case the onboarding documents.
- Why adapter metadata is insufficient: this is not adapter knowledge; it is the
  version the scaffolder itself was released as.
- Whether a schema version changes: no.

## Risks / Trade-offs

**A version bump touches every package.** A changeset moving 29 workspaces is a
wide diff, and the changelogs it writes are mechanical. The alternative leaves
the registry inconsistent, which is worse for a pre-alpha whose whole claim is
honesty about state.

**The scaffolder's new branch is exercised outside the workspace.** Every
existing test scaffolds inside the repository, where the `link:` branch runs. A
new test has to drive the no-checkout path deliberately, and the end-to-end
script still rewrites the entries afterwards, so the placeholder cannot quietly
return.

**The candidate ships with three packages unpublished.** Until issue #17
finishes, `npx navirox` against the public registry still fails. The notes state
that plainly and the publication sequence is written so the last step is a
check, not an assumption.

## Open Questions

- Whether the follow-up pilot CI job should take an app name so the workflow can
  run any example, rather than another `--filter` block per app.
- Whether the bare `0.1.0` tag should be repointed once `0.1.1` exists, or left
  as the record of the rename attempt. This issue keeps every existing tag and
  adds a candidate tag, and the mismatch is written down rather than rewritten.
