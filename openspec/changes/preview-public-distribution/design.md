# preview-public-distribution design

## Context

`docs/DEVELOPER-PREVIEW.md` makes the developer-preview claim conditional on
fresh evidence, and its acceptance bar requires one documented public
installation and analysis path "without workspace links or unpublished
dependencies". `docs/GETTING-STARTED.md` already documents two paths: the public
`npm create navirox` plus `npx navirox` path, and the tarball path that
`scripts/e2e-scaffold.mjs` performs.

A registry probe on 2026-09-22 establishes which path is real. Twenty-six
packages resolve at `0.1.0`; `@memolabs-apps/cli`, `@memolabs-apps/source-lit`,
`@memolabs-apps/source-solid`, `@memolabs-apps/target-vue` and
`@memolabs-apps/visual-benchmark` do not exist on the registry. The wrapper
`navirox` depends on `cli`, and `cli` depends on `source-lit` and `source-solid`,
so the public `npx navirox` path fails at two links regardless of documentation.

## Decisions

### Take the retained-limitation branch, not the publish branch

The contract allows either. Publishing the five packages is a release action with
its own evidence requirements (a release candidate build, a token, a version
decision) and is explicitly out of scope in `proof-journeys-release-evidence`.
Taking the limitation branch keeps this change inside the preview sequence and
makes the public claim honest today rather than dependent on an unperformed
release.

Rejected: publishing the missing packages to make the documented path true. That
would turn a documentation change into a release, and a partial publish would
leave the same failure at a different link.

### The limitation names the packages, not just the symptom

"It does not work yet" is not actionable and cannot be checked. Naming the five
unpublished packages makes the gap auditable and tells a future release exactly
what is missing.

Rejected: stating only that public installation is incomplete. That is the
unverifiable phrasing the acceptance bar exists to prevent.

### A check, not a promise

The limitation is only durable if something fails when it becomes false. A check
compares the packages a documented install path names against the registry and
fails when one is missing, so the day the five packages publish, the failing
check is the signal to update the wording rather than leave a stale claim.

Rejected: a comment or a dated note. Both drift silently and neither fails a
build.

### The tarball path is named as the verified one

`scripts/e2e-scaffold.mjs` already installs the workspace's packed tarballs and
runs in CI, so it is a path with executed evidence. Naming it as the verified
consumer path is a statement about what was run, not about what is intended.

Rejected: describing the tarball path as a temporary workaround. It is the
verified path today, and calling it temporary would imply a public path that does
not exist.

## Contract change questions

No shared contract changes. This updates two documentation files and adds a
repository check; no `@memolabs-apps/*` package, public type, adapter metadata or
schema version changes.
