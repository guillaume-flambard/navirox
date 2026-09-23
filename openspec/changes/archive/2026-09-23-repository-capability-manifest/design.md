## Context

See `proposal.md` - Why. The source adapters already read files and build an
`AppGraph`, and `@memolabs-apps/source` already holds the neutral seam (files,
boundaries, capabilities, versions, project). What is missing is a preflight that
describes the repository itself and decides eligibility before any graph,
lowering or write.

## Goals / Non-Goals

**Goals:**

- A deterministic, hashed manifest produced before anything is written.
- Every fact carries a source location and a confidence.
- An explicit eligibility decision that gates transformation.

**Non-Goals:**

- Building the App Graph, lowering, generating, or reading a framework's
  templates. Discovery describes the repository, it does not analyse the app.
- Network access: discovery reads the local checkout only.

## Decisions

### A new neutral package, `@memolabs-apps/discovery`

Discovery is a distinct concern from the graph and from inspection, so it gets
its own neutral package. Files are read through an injected reader, so the module
never touches the filesystem directly and a dry run stays dry.

Rejected: growing `@memolabs-apps/inspect`, which already orchestrates adapter
selection and would blur two concerns. Rejected: putting it in a source adapter,
which would make repository topology framework knowledge.

### Injected readers, no opaque shell

Discovery receives the file list and a reader function, and never runs a shell
command or a build tool.

Rejected: shelling out to the package manager, whose output is opaque, slow and
non-deterministic.

### The manifest is data, the graph is unchanged

The manifest is a separate artefact; the `AppGraph` schema does not change.

Rejected: adding topology fields to `AppGraph`, which would widen a stable
contract for a concern the graph does not describe.

### Only `eligible` advances

`eligible-with-deltas` requires an explicit acceptance of each delta,
`manual-discovery-required` asks a person to finish discovery, and `refused`
stops the run. No other result may start transformation.

Rejected: treating a lower-confidence result as good enough to continue, which is
exactly how an unsupported repository would be presented as transformable.

### Contract change questions

No shared contract changes. No graph concept is added, no schema version of an
existing contract moves, no public `@memolabs-apps/*` type name is added or
re-exported, and no source adapter, target provider or runtime seam is touched.
The new manifest introduces its own versioned contract, owned by discovery.
Adapter metadata is insufficient here because topology, lockfiles, plugins and
escape hatches are facts about the repository, not about what an adapter
declares.

## Risks / Trade-offs

- Discovery could guess a package manager from a manifest -> every fact carries
  its location and confidence, and an ambiguous repository is several candidates
  rather than one chosen answer.
- A large monorepo could be slow to walk -> the file list is injected, so the
  walk is bounded by the caller and measured in tests.
