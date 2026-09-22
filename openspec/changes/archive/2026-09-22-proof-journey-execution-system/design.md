# Design: proof-journey execution system

## Context

The repository has several authoritative documents with different jobs. The
repositioning pack defines identity and architecture; pilot, commercial, and
visual documents bound claims; evidence and executable checks establish current
behavior. A linear delivery program needs an operational overlay, not another
restatement of those documents.

## Decision

`docs/EXECUTION-CHARTER.md` is the short entry point. It points to source
authority, separates verified facts from aspiration, and gives an agent a
stop-and-propose rule. `docs/PROOF-ROADMAP.md` expresses gates P0 through P7.
`docs/OPENSPEC-BACKLOG.md` turns each gate into an atomic future change with
dependencies, task sequence, evidence, and scope boundary.

The program starts with Baserow-qualified Vue/Nuxt work and then SuiteCRM-
qualified Angular work. The companions must be independent original work. This
allows reproducible technical proof without claiming affiliation or importing
unapproved data, branding, code, credentials, or distribution obligations.

## Alternatives considered

- Put the entire program in `docs/repositioning/ROADMAP.md`: rejected because
  that document is canonical long-horizon direction and should not be rewritten
  each time the next proof changes.
- Create all future OpenSpec changes now: rejected because their implementation
  details depend on evidence from preceding stages. The backlog instead fixes
  their scope and acceptance boundary, then requires a scoped proposal when the
  dependency is satisfied.
- Treat a benchmark as the companion implementation source: rejected because it
  would imply conversion, licensing, branding, and customer-data claims that the
  pilot briefs explicitly prohibit.

## Contract change

No shared runtime, source-adapter, App Graph, target-provider, or public API
contract changes. This change adds process governance only, so schema versioning
and the shared-contract questions do not apply.
