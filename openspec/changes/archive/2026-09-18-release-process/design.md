## Context

`@changesets/cli` 3.0.3 has been a root devDependency since the monorepo was
created, `.changeset/config.json` has been in place just as long, and
`CONTRIBUTING.md` documents the rule. What has never happened is a release:
every package is at `0.0.0` and `.changeset/` contains only `config.json`.

Four properties of this repository shape the work, and each was measured
rather than assumed.

The package set is published together. All 25 packages under `packages/` are
public and none is `private`, they all sit at the same version, and internal
dependencies use the `workspace:` protocol. `examples/vue-basic` is
`private: true`, and the root `navirox-monorepo` is already in the config's
`ignore` list.

`changeset version` does less to the tree than it looks like it should.
Measured on this repository: it moves the 25 packages to `0.1.0`, writes a
`CHANGELOG.md` in each package directory, leaves every `workspace:*` range
exactly as it was, does not touch `pnpm-lock.yaml`, and deletes the changeset
file it consumed.

`changeset status` is a usable check for a pull request and a misleading one
otherwise. With `--since=<ref>` and a package diff that has no changeset it
exits 1 with a message naming the fix. Without `--since` it exits 0 and prints
an empty list. That second form is why it cannot be a gate on its own.

Nothing in this repository may publish. There is no npm credential in play and
no release has been agreed, so `changeset publish` is out of scope by
construction. `changeset git-tag` gets the tags without touching a registry,
and its tags are per package.

## Goals / Non-Goals

**Goals:**

- The first changeset exists and is the release note for `0.1.0`.
- `0.1.0` is the version of every public package, with a changelog beside each
  one, produced by the tool rather than by hand.
- The release carries a `0.1.0` tag, and the per package tags changesets
  creates are kept alongside it.
- A pull request that changes a package without a changeset fails a check
  instead of being discovered later.
- The repository says which parts of a release were executed here and which
  were not.

**Non-Goals:**

- Publishing to npm. `changeset publish` is not run, and nothing in this change
  makes a registry the next step.
- A continuous release job that versions or tags on merge. That needs a
  published registry and a token policy first.
- Versioning the example, the root, or the fixtures. They are private or
  already ignored.
- Rewriting the package map or aligning package versions with npm's minor
  rules. All packages share one version today and this change keeps it that
  way.
- Fixing the root `description`, which still reads as the pre-repositioning
  product line. It is recorded as debt and left alone.

## Decisions

**The first changeset is `minor` for all 25 packages, written with the
non-interactive form.** `changeset add -m "..." --minor a,b,c` writes the file
without prompting, which is how the first one gets written here and how it
gets verified. `minor` because `0.0.0` to `0.1.0` is the claim being made: the
product is not feature complete and the version says so. Rejected: `patch`,
which would produce `0.0.1` and lose the meaning of a first release;
`--major`, which claims a stability that `PLAN.md` explicitly does not.

**`changeset version` is executed, not illustrated.** The 25 versions and the
25 changelogs are committed. Rejected: documenting the command and leaving the
tree at `0.0.0`, which would leave the definition of done item unmet and make
the next release start from a version that does not exist anywhere.

**Both tag families are created.** `changeset git-tag` produces one tag per
package, which is what a future `changeset publish` would expect to find, and
a milestone tag `0.1.0` goes on the same commit because it is the name the
definition of done uses. Rejected: per package tags alone, which do not
contain the string the item asks for; a bare `0.1.0` tag alone, which would
not match what changesets creates and would have to be reconciled later.

**The check is `changeset status --since` on `pull_request` only.** The base
commit comes from `github.event.pull_request.base.sha` through an `env:`
entry rather than interpolated into the shell, because the repository runs
`zizmor` with its default ruleset and that ruleset includes
`template-injection`. The checkout of that job needs `fetch-depth: 0` so the
base commit exists locally. Rejected: running the check on `main` as well,
where there is no base to compare against and where a failure would mean the
release commit cannot land; running it without `--since`, which was measured
to exit 0 while a package diff sat in the tree and would therefore enforce
nothing.

**Nothing is published.** No `changeset publish`, no registry step, no token.
The claims in `PLAN.md` say exactly which commands ran.

## Risks / Trade-offs

The check cannot be observed in CI without pushing, and this session is
committing locally by decision. What is proven here is the command's exit
codes on this repository: `--since=origin/main` exits 1 with a package diff
and no changeset, `--since=HEAD` exits 0. The workflow step itself is the one
part of this change whose behaviour in a real run is still unverified, and it
is recorded that way rather than claimed.

The rule starts biting after this change and not before. Four changes have
landed without a changeset, deliberately, because nothing was published and
nothing changed for a user. From `0.1.0` on, a change to a package needs one,
and this change is what makes that true rather than aspirational. A change
that touches only docs, workflows or `PLAN.md` still passes, because no
package changed.

`changeset version` rewrites 50 files in one command. That is the tool's
design, and the alternative is hand-editing 25 manifests and 25 changelogs,
which is exactly the manual step changesets exists to own.

All packages share one version, so a change to one package produces a release
of all of them. That is right for a first release and wrong later; the moment
packages need to move independently, the config grows `fixed` or `linked`, and
that is a change to the config rather than to this process.

## Open Questions

Whether the check should also require a changeset on `main` once releases
become automated. That needs a publish step, which needs a registry decision.

Whether the example should be versioned alongside the packages so that a
scaffolded app can name the release it came from. Deferred: the scaffolder
reads the packages it ships, not the example.
