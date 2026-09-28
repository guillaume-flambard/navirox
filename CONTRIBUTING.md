# Contributing to Navirox

Navirox is pre-alpha. Contributions are welcome, but a small, evidenced change
is more useful than a broad promise. If your idea changes product direction or
introduces a new external dependency, open an issue or discussion before doing
the implementation work.

## Find a useful change

Start with the [documentation index](docs/README.md) and the current
[execution charter](docs/EXECUTION-CHARTER.md). The source-of-truth order is:

1. Repository rules in `AGENTS.md` and the task or issue being implemented.
2. The execution charter and an active OpenSpec change.
3. Current product and architecture documents in `docs/repositioning/`.
4. Working code, tests, and fresh CI for claims about current behavior.
5. Dated evidence and historical documents for the event they record.

Browse [`good first issue`](https://github.com/guillaume-flambard/navirox/labels/good%20first%20issue)
or [`help wanted`](https://github.com/guillaume-flambard/navirox/labels/help%20wanted).
Those lists may be empty. In that case, propose one focused problem in
[Issues](https://github.com/guillaume-flambard/navirox/issues) or ask in
[Discussions](https://github.com/guillaume-flambard/navirox/discussions).

## Set up

You need Node.js 22.13 or newer and Corepack.

```bash
git clone https://github.com/guillaume-flambard/navirox.git
cd navirox
corepack enable
pnpm install --frozen-lockfile
pnpm build
pnpm test
```

For a fork, clone your fork and add this repository as `upstream`. Keep feature
branches focused on one concern.

## Verify a change

During development, run the closest package test first:

```bash
pnpm --filter @memolabs-apps/source-vue test
```

Before requesting review, run the repository gates:

```bash
pnpm docs:check
pnpm build
pnpm typecheck
pnpm test
pnpm lint
pnpm --filter vue-basic lint
pnpm format:check
pnpm deps:check
```

Native behavior needs the matching platform proof. Say exactly what you ran in
the pull request. A package test, an Android build, and an iOS simulator journey
are different evidence.

## Architectural boundaries

`AGENTS.md` is the complete contract. The boundaries most often relevant to a
contribution are:

- Only `@memolabs-apps/runtime-symbiote` may import the current renderer or
  React Native.
- Applications import only `@memolabs-apps/*` packages.
- Public packages must not re-export renderer types, classes, components, or
  prop names.
- Source-framework behavior belongs in `source-*`; neutral planning and
  evidence belong in neutral packages; rendering belongs at the target or
  provider edge.
- Unsupported behavior is reported or refused. It is never replaced by a
  plausible but unproved implementation.

Tests enforce the import boundary. Do not weaken the test to make a dependency
violation pass.

## Tests, evidence, and documentation

New behavior needs a test. A bug fix needs a test that fails without the fix.
If a public claim changes, update the evidence or limitation that justifies it.
Do not upgrade `experimental`, `preview`, or `supported` from intuition alone.

Repository paths in committed evidence must be portable. Use placeholders such
as `<repo>` or a path relative to the repository instead of a contributor's
home directory.

## Changesets

A user-visible change to a publishable package needs a changeset. Documentation,
workflow, and test-fixture-only changes normally do not.

```bash
pnpm changeset
pnpm changeset status --since=main
```

Publishing, tagging, and registry credentials remain maintainer actions.

## Pull requests

- Explain the problem and the smallest chosen solution.
- Link the issue, OpenSpec change, or evidence the work serves.
- List exact verification commands and any check you could not run.
- Record new dependencies with their exact version and reason.
- Keep generated artifacts, credentials, customer data, and machine-specific
  paths out of the diff.
- Follow the [Code of conduct](CODE_OF_CONDUCT.md).
