## Why

Every package in this repository sits at `0.0.0`, no changeset has ever been
written, and `.changeset/` holds nothing but `config.json`. `CONTRIBUTING.md`
has told contributors to add a changeset for as long as the file has existed,
and nothing has ever executed that instruction: no command in the repository
reads `.changeset/`, no CI job checks it, and nothing has been published. The
workflow was written down and then never wired to anything.

That was defensible while nothing was released, and it stops being defensible
at `0.1.0`. The moment a version exists, a user-visible change that ships
without a changeset ships without a changelog entry and without a version
bump, and the gap is invisible until somebody tries to read the release notes
that were never written. The 0.1 definition of done names this work in two
places, as the release process and as `0.1.0` released through changesets, and
it is the last item of the 0.1 list that is still open.

## What Changes

- Write the first changeset: all 25 public packages at `minor`, one message.
  That is the release note for `0.1.0`, and it is the artifact a contributor
  is asked to write from now on.
- Run the release locally with `changeset version`, which moves the 25
  packages to `0.1.0` and creates a `CHANGELOG.md` beside each one, and record
  what it does and does not touch.
- Tag the release. `changeset git-tag` creates one tag per package
  (`@navirox/ui@0.1.0`), and a milestone tag `0.1.0` goes on the same commit
  because that is the name the definition of done uses and no changesets
  command produces it.
- Add a check that the process is actually running: a `pull_request` job step
  that fails when a package changed without a changeset, which is what
  `changeset status --since` reports.
- Say plainly in `PLAN.md` what was executed and what was not.
  `changeset publish` uploads to npm and will not be run.

## Impact

- `.changeset/`: the first changeset is written, then consumed by
  `changeset version`, so the committed state holds `config.json` again plus
  the release it produced.
- 25 `packages/*/package.json` files and 25 new `packages/*/CHANGELOG.md`
  files.
- `.github/workflows/ci.yml`: one conditional step on `pull_request`, and the
  checkout of the job that carries it, so the base commit is present.
- `CONTRIBUTING.md`: the changeset section gains the command that enforces it.
- `PLAN.md`: the release items are recorded with what was run.
- No package source changes, no API change, no schema change, no runtime
  change. Git tags are created locally and are not part of a commit.
- Two items stay deferred and are not claimed: nothing is published to npm, and
  the `description` field of the root `package.json` still carries the wording
  from before the repositioning.
