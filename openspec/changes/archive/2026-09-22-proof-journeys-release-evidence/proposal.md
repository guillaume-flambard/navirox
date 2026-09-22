# Proof journeys release evidence

## Why

The proof program now carries two complete journeys. Each has a benchmark
contract, a source-to-target path, a device evidence record, a readiness matrix
and an artifact-governance gate. What it does not have is one place where an
outside evaluator can see both journeys side by side and tell what is proven,
what is simulated, what is deferred and what may be installed today. Without that
index a reader has to reconstruct the boundary between the proof and the product,
and the honest gap, that public package installation is not complete, is easy to
mistake for a supported install path.

## What changes

- Add a proof index that links each journey's command, immutable input, artifact,
  limitation and release status, and that cites the evidence documents instead of
  copying them.
- Review the README and the public-facing language against the pilot, marketing,
  visual and installation constraints the program already records.
- Re-run the documented consumer installation path and state the public npm gap
  plainly, publishing only the tarball path that was actually verified.

## Capabilities

### New Capabilities

- `proof-release-evidence`: the proof index, its release-status vocabulary and
  the installation-path statement.

### Modified Capabilities

None.

## Impact

Documentation, the README and the release notes. No package is published, no
store listing is created, no partnership is asserted and no support status is
raised by this proposal alone.
