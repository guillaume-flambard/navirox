## 1. Write the first changeset

- [x] 1.1 Build the package list from `packages/*/package.json` and write the
      first changeset with the non-interactive form, `corepack pnpm exec
      changeset add -m "<release note>" --minor "<the 25 names, comma
      separated>"`. Verify: exit 0, the recap lists all 25 packages, and
      `.changeset/` now holds a markdown file whose frontmatter carries 25
      `minor` entries and whose body is the release note.
- [x] 1.2 Read the written file and confirm its shape before relying on it:
      one fenced frontmatter block, one line per package, the body below it.
      Verify by printing the file and counting 25 version lines.

## 2. Version and tag the release

- [x] 2.1 Run `corepack pnpm exec changeset version`. Verify: exit 0, the 25
      `packages/*/package.json` read `0.1.0`, a `CHANGELOG.md` exists in each
      of the 25 package directories, the changeset file is gone, and
      `git status --short pnpm-lock.yaml` is empty.
- [x] 2.2 Read one changelog and one manifest diff and confirm the shape:
      the changelog has a `## 0.1.0` heading with the release note under it,
      and the manifest diff is the version line alone. Verify with `git diff
      packages/cli/package.json`, which must show no change to any
      `workspace:*` range.
- [x] 2.3 Create the per package tags with `corepack pnpm exec changeset
      git-tag`. Verify: `git tag` lists 25 tags of the form
      `@navirox/<name>@0.1.0` and `create-navirox@0.1.0`.
- [x] 2.4 Create the milestone tag with `git tag -a 0.1.0 -m "<message>"`.
      Verify: `git tag` lists `0.1.0`, and `git tag | grep -x 0.1.0` prints
      it, which the changesets tags cannot satisfy on their own.

## 3. Enforce the process on a pull request

- [x] 3.1 Add `fetch-depth: 0` to the checkout of the job that will carry the
      check, so the pull request base commit is in the local history. Verify
      by reading the workflow and by the step in 3.2 resolving a base that is
      older than the head.
- [x] 3.2 Add the check as a step that runs only for `pull_request`, passing
      the base through `env: BASE_SHA: ${{ github.event.pull_request.base.sha }}`
      and running `pnpm changeset status --since="$BASE_SHA"` so no event
      payload reaches the shell. Verify: `ruby -ryaml` parses the file, and
      the step carries both the `if:` guard and the `env:` entry.
- [x] 3.3 Prove the command's two outcomes on this repository from the
      command line: it exits 1 with a package diff and no changeset, and
      exits 0 when no package changed. Record both exit codes next to the
      step in `PLAN.md`, together with the honest note that the step itself
      has not been seen in a CI run.

## 4. Document the process where contributors read it

- [x] 4.1 Extend the changeset section of `CONTRIBUTING.md` with the two
      commands a contributor can run (`pnpm changeset` to write one, and the
      check the pull request will apply), and with what happens when a
      changeset is forgotten. Verify by reading the section and by making
      sure the commands named there are the ones the workflow runs.
- [x] 4.2 Check `CONTRIBUTING.md` for the release wording that predates this
      change and correct anything that describes a step which does not exist.

## 5. Record what was run

- [x] 5.1 Check the release item of the 0.1 definition of done in `PLAN.md`
      and add the measurement under it: the first changeset, the 25 versions
      at `0.1.0`, the 25 changelogs, the two tag families, and the check.
      Include what was not done: nothing is published, and the workflow step
      has not been observed in a CI run.
- [x] 5.2 Leave the final definition of done line about `0.1.0` unchecked and
      record why under it: the local half ran and is measured, `changeset
      publish` did not, so nothing reached a registry and the line must not say
      otherwise. Verify by reading the item and confirming that every sentence
      matches a command that ran, and that no sentence claims a release that
      did not happen.

## 6. Verify

- [x] 6.1 Run the full gate at the root: `corepack pnpm build`,
      `typecheck`, `test`, `lint`, `format:check`, `deps:check`. Verify: all
      six exit 0, and `deps:check` matters because the version rewrite touched
      25 manifests.
- [x] 6.2 Confirm the toolchain still sees the tree as consistent:
      `corepack pnpm install --frozen-lockfile` must exit 0, since
      `changeset version` left the lockfile untouched.
- [x] 6.3 Run the acceptance journey on both platforms, killing any leftover
      Metro first, and confirm 4/4 on Android and 4/4 on iOS. The example is
      untouched by this change, so this is a non-regression check.
- [x] 6.4 Validate the change with `openspec validate release-process
      --strict`, tick the tasks, and archive it with `openspec archive
      release-process -y`. Verify: `openspec validate --specs` passes and the
      archive directory gains one entry.
- [x] 6.5 Commit locally. Verify: the commit contains the 25 versioned
      manifests, the 25 changelogs, the workflow step, the documentation and
      the archived change, and the pre-commit hook is green. Do not push:
      this session commits locally by decision, so the CI run is not part of
      the proof.
