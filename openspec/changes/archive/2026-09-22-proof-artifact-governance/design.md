# Design: proof artifact governance

## Decision

The program will add a lightweight proof-artifact manifest. Every retained
fixture, screenshot, report, and CI upload is classified as original synthetic
data, public source reference, generated artifact, or prohibited material. An
automated hygiene gate checks committed proof paths and selected upload inputs
for credential-shaped values, unapproved data fixtures, and undeclared assets;
ambiguous matches fail closed for human review.

Benchmark requalification is separate from historical reproduction. Historical
reports retain their immutable revision and result. A requalification run reads
the current upstream reference only to report drift, toolchain changes, or a
decision to create a new pinned benchmark profile. It cannot overwrite the old
evidence silently.

## Alternatives considered

- Rely on the pilot briefs alone: rejected because a prose prohibition does not
  catch an accidental fixture, screenshot, or upload.
- Automatically update benchmark commits: rejected because it destroys the
  reproducibility of a published historical claim.
- Apply a generic repository-wide secret program here: rejected because this
  change concerns the proof artifact surface and should not expand scope.

## Contract change

No shared runtime or source contract changes. The manifest is proof governance;
it does not alter the App Graph, migration state, or public package API.
