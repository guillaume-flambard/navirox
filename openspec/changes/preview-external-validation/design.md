# preview-external-validation design

## Context

`docs/DEVELOPER-PREVIEW.md` promises a framework-aware readiness report and
forbids upgrading support from anecdotal feedback. The proof program already
keeps every workflow record at one of two statuses, `unvalidated hypothesis` or
`practitioner-informed`, defined in `docs/WORKFLOW-EVIDENCE.md`, and
`docs/OPERATOR-FEEDBACK.md` already defines a consent-first interview that
produces the latter without requesting credentials or data. What no document
records is whether the report is useful to someone who does not own the code.

## Decisions

### Validate by running, not by asking

The primary external read is the analyzer run against pinned public repositories
from the verified tarball path. It needs no contact, no consent and no account,
so it can be executed and recorded today. A developer conversation is the
secondary path and reuses the existing consent-first guide.

Rejected: making a developer conversation the primary evidence. It is not
executable without an external person, and the contract's own precursor change
says the preview sequence does not contact external developers.

### The record uses the vocabulary the project already has

The status is `unvalidated hypothesis` when only the self-run analysis exists,
and `practitioner-informed` when a consented conversation informs it. No third
status is invented, and neither status is customer demand.

Rejected: a new `externally-validated` status. It would read as a support
upgrade and is not defined anywhere the project already treats as authority.

### Usefulness is observed against the promised categories

A report is useful for this record when it names shared, adaptable,
platform-specific, manual and unknown work without inventing a migration
decision ("unknown" and "manual" are valid results, per the architectural
rules). Usefulness is recorded per repository, not averaged into a score.

Rejected: a numeric usefulness score. A handful of repositories cannot support a
percentage, which `docs/OPERATOR-FEEDBACK.md` already forbids for feedback.

### The repositories are external and pinned

Each validated repository is public, outside this workspace, and pinned to a
commit, so the run is reproducible and the report is comparable across time.
Repositories the project already benchmarks may be included, but the list must
contain at least one repository chosen for external read rather than workflow.

Rejected: validating against a local fixture. That measures the harness, not
whether an outside repository produces a useful report.

## Contract change questions

No shared contract changes. This records evidence about the analyzer's output
and does not change the analyzer, the graph model, an adapter or a target
provider. No `@memolabs-apps/*` public type changes and no schema version
changes.
