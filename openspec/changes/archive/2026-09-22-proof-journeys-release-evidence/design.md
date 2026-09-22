# Design: proof journeys release evidence

## Decision

Add one document, `docs/PROOF-INDEX.md`, that carries a row per journey and cites
the existing evidence rather than restating it. Each row names the command that
produced the evidence, the immutable input it used, the artifact it wrote, the
limitation the evidence records and the release status of the claim. The status
vocabulary is deliberately small and honest: `supported`, `simulated`, `deferred`
and `excluded`, the same four outcomes `docs/READINESS-MATRIX.md` already uses,
so a reader learns one vocabulary instead of two.

The index is checked rather than trusted. A test asserts that every row points at
an artifact that exists, that every benchmark project in `benchmarks/catalog.json`
has a row, and that every status word comes from the declared set. The
installation statement lives in the index rather than in a package README,
because it describes the whole program and is expected to change when
distribution changes.

## Alternatives considered

- A separate release-notes document per journey was rejected. Two documents with
  the same vocabulary drift apart, and the reader's question is comparative.
- Copying the evidence into the index was rejected. A copy is a second source of
  truth that goes stale silently, which is the failure this program already
  addressed for retained artifacts in `docs/PROOF-ARTIFACTS.md`.
- Claiming a supported installation path was rejected. The consumer path is
  documented and exercised, but public package installation is incomplete, and
  the honest statement is the tarball that was verified.

## Contract change

No shared runtime or source contract changes. The index is release evidence and
does not alter the App Graph, the migration state, the runtime seam or any public
package API.
