## Context

See `proposal.md` - Why. The conversion already exists: `@memolabs-apps/target-vue`
exports `compileVueTarget(source, sourceName, outputPath)` returning
`{ report: { findings }, manifest: { compilerVersion, ... }, code? }`, and
`serializeProvenanceManifest` renders the manifest deterministically. The CLI is
the composition root: it already composes the source adapters, the planner, the
inspector and the migration engine. This change adds the command that runs the
provider.

## Goals / Non-Goals

**Goals:**

- A dry-by-default `convert` command that emits only fully supported screens.
- A provenance record beside every emitted screen.
- The planner-approved units moved unchanged.
- Every refusal reported with its finding.

**Non-Goals:**

- A new target provider or a broader Vue subset.
- Visual fidelity, release publishing, or a public install claim.

## Decisions

### The provider is reached through the CLI composition root

The CLI imports `@memolabs-apps/target-vue` the way it already imports the source
adapters, and calls `compileVueTarget` directly. A target is a provider, not a
framework, and the CLI is where the pipeline is composed.

Rejected: shelling out to the proof scripts, which are not a product surface and
cannot be exercised without a device.

### A screen is emitted only when the provider returns source

`code === undefined` means the screen is refused: the command writes nothing for
it and reports the findings. This keeps a screen either converted or refused,
never converted-looking.

Rejected: emitting a best-effort screen, which would make an unsupported web
construct look migrated.

### The output path is derived from the screen's source file, inside the output root

A screen writes to `<outputRoot>/<source file>.native.vue`, and anything that
resolves outside the output root is refused.

Rejected: an arbitrary user-supplied output file, which would let a run write
outside the directory it was given.

### Provenance is written from the provider manifest

The manifest is serialised with `serializeProvenanceManifest`, so the record is
the provider's, not a second description that could disagree with it.

Rejected: a bespoke provenance record written by the CLI.

### The moved units go through the migration engine

`runMigration` already moves the planner-approved units, refuses an escaping
path, and rolls back a failed run. The command reuses it rather than copying
that logic.

Rejected: a second copy loop in the CLI.

### Contract change questions

No shared contract changes. No graph concept is added, no schema version moves,
no public `@memolabs-apps/*` type name is added or re-exported, and no source
adapter or target provider is modified; the only new edge is a CLI dependency on
a target provider. Adapter metadata is irrelevant here because whether a screen
converts depends on the target provider's supported subset, not on what an
adapter declares.

## Risks / Trade-offs

- The CLI gains a target dependency -> a target is a provider and the CLI is the
  composition root, so this does not cross the neutral/seam rules; the import
  boundary check verifies it.
- A refused screen could read as a failure -> the report names the screen and its
  findings, and the run says how many were emitted versus refused.
