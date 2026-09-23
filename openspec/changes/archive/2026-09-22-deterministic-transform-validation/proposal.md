# deterministic-transform-validation

## Why

The migration engine has exactly one transform, `copy-movable-unit`, and its own
source says the reason: a transform that rewrites code "would have needed a proof
this repository does not have yet". That proof is what this change creates. The
Vue/Nuxt developer-preview contract (`docs/DEVELOPER-PREVIEW.md`, change 5)
allows a new transform only when it is provenance-linked, reversible, and
validated by behaviour and a clean build, and the contract's task 3.4 repeats the
same four conditions: provenance, rollback, behavioural validation and a clean
build check.

Without such a transform the preview stops at copying files, and the first
promise a reader will test against a real repository, that a small, safe rewrite
can happen deterministically, has no evidence behind it.

## What Changes

- Add one new transform that performs a bounded, deterministic rewrite rather
  than a byte-for-byte copy, and that records the provenance of every change it
  makes (the input, the rule that fired, and the output it produced).
- Prove the transform is reversible: after a run that wrote, a rollback returns
  the output directory to its previous contents, and the engine already holds the
  previous bytes per file for exactly this.
- Validate behaviour: a test drives the transform through the real planner and
  engine and asserts on the rewritten output, not on an implementation detail.
- Validate the build: `pnpm build` stays clean after the increment, which the
  repository's own pre-commit hook enforces.

## Capabilities

### New Capabilities

- `deterministic-transform-validation`: a new transform is admitted only with
  recorded provenance, a demonstrated rollback, a behavioural test and a clean
  build.

### Modified Capabilities

None.

## Impact

This adds one transform to `@memolabs-apps/migrate`, its behavioural test, and
the provenance record the transform emits. It changes no source adapter, no
target provider, no runtime seam, no public `@memolabs-apps/*` type name and no
schema version. It publishes nothing and raises no support status.
