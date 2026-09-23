## Context

See `proposal.md` - Why. `@memolabs-apps/source` already declares the adapter
contract and the forbidden import list, `@memolabs-apps/compat` already holds the
compatibility registry, and the adapters already detect a framework version. What
is missing is the link between a detected version and an evidenced, gated
support claim.

## Goals / Non-Goals

**Goals:**

- A machine-readable matrix that ties every profile to a version range and
  evidence.
- A deterministic refusal for an unverified version.
- A corpus with a positive, a boundary and a refused fixture per line.

**Non-Goals:**

- Widening support, or upgrading a range automatically.
- Touching a target provider or the runtime.
- Network access: the corpus and lockfiles are local fixtures.

## Decisions

### The matrix is data in a neutral package

The matrix lives beside the compatibility registry in
`@memolabs-apps/compat`, as data, and the adapters read it; no adapter hard-codes
its own supported versions.

Rejected: a per-adapter constant, which drifts from the registry and cannot be
audited in one place.

### An unverified version is refused, never downgraded

The adapter returns `outside-verified-range` with the fact, location, expected
profile and resumption path.

Rejected: falling back to a nearest verified version, which would transform a
repository on a version nobody verified.

### Requalification is a protocol with gates

An upstream major opens a requalification; the range widens only after the
corpus, builds, device journeys and captures pass.

Rejected: bumping a dependency range and calling it support.

### Contract change questions

No shared contract changes. No graph concept is added, no schema version of an
existing contract moves, no public `@memolabs-apps/*` type name is added or
re-exported, and no source adapter, target provider or runtime seam is touched.
Adapter metadata is insufficient here because the decision depends on the
resolved lockfile versions and the detected plugins, not on a declared name.

## Risks / Trade-offs

- The matrix could be declared without fixtures -> a test asserts every verified
  line has its three fixtures with lockfiles.
- A refusal could be too coarse to act on -> the refusal carries the fact, its
  location, the expected profile and the resumption path.
