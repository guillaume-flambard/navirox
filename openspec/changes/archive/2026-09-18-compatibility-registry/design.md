## Context

The planner exists, the plan is deterministic, and every dependency in it is
unknown for one reason. `@memolabs-apps/compat` has been a declared surface since the
first commit of the repositioning and has never contained a fact, so the reason is
real rather than a shortcut.

The repository does have facts, though. It has an acceptance application that
builds and runs on both platforms, it has evidence files recording what was
measured, and it has packages it ships itself. The gap is that those facts live in
prose and in CI rather than in something a plan can read.

## Goals / Non-Goals

**Goals:**

- A record model with a closed status set and an evidence level on every claim.
- A seed limited to what this repository demonstrates, with no package listed on
  expectation.
- A planner rule at the compatibility layer, so a recorded package is classified
  from its record and an unrecorded one stays unknown.
- A visible difference on the acceptance app's plan.

**Non-Goals:**

- A hosted registry, a contribution flow, or a published format for others.
- Semver resolution. A subject carries a range as written, and range satisfying is
  a separate problem the day it matters.
- Compatibility for capabilities, frameworks and providers beyond the shape the
  model declares. The seed contains package facts because those are the facts this
  repository has.
- Consulting the network. Nothing here fetches anything.

## Decisions

**The seed is limited to what the acceptance application demonstrates.** The
packages the application actually runs on both platforms are the runtime
packages, the Vue runtime and Pinia, and each record cites the evidence file or
the CI run that shows it. Anything else is absent, and absence is the honest
answer: an empty lookup is the difference between a registry that knows nothing
about a package and a registry that quietly guesses it is fine. Alternative
rejected: seeding a list of popular packages from general knowledge, which would
have been the exact failure the PRD's first principle forbids.

**Status and evidence level are separate.** `supported` says what Navirox claims;
`android-build-tested` says how strongly it can claim it. Collapsing them would
make a documented statement and a proven build indistinguishable, and the product's
whole argument is that it distinguishes them. Alternative rejected: a single
confidence number, which loses the kind of proof and cannot be audited.

**The registry is data, and it is validated on load.** A record without evidence
fails loading rather than being accepted, because the failure mode is a claim
nobody can defend. The seed is written as typed data inside the package and is
parsed by the same loader as any external data, so a bad edit fails the moment
something reads it. Alternative rejected: trusting the typed constant without
re-validating it, which would have left the one file most likely to be edited by
hand as the one file with no check.

**The planner receives the registry rather than loading it.** The planner's
contract is that it reads the graph and its inputs and writes nothing; loading is
the composition root's job, the same division the adapter registry already uses.
Alternative rejected: the planner reading a file, which would have made a pure
function depend on a working directory.

**The rule lives at the compatibility layer.** A source adapter can supply source
rules and a target provider will supply target rules, but a statement about
whether something works natively belongs to neither, and the layer name says so.
Alternative rejected: putting it in the generic layer, which would have made the
one rule that reads outside facts indistinguishable from the ones that read only
the graph.

Contract change questions, per AGENT-GUIDE section 12:

- Why the current arrangement is insufficient: the product's most common real
  question, whether a dependency works, had no representation at all.
- Which real consumer demonstrated the need: the planner's dependency rule and the
  plan the command prints.
- Why adapter owned metadata is not enough: compatibility is a fact about a
  package and a target, not about a framework, and every adapter needs the same
  answer.
- Whether the schema version changes: no. The compatibility registry is a new
  artifact with its own version, and the App Graph and the plan schema stay as they
  are.

## Risks / Trade-offs

- **A seed of a handful of packages barely moves the number.** It moves it by
  exactly the facts the repository has, which is the point, and it establishes the
  mechanism so the next fact is a data change rather than a code change.
- **The model declares subject kinds the seed does not use yet.** That is a
  promise in a type; the alternative is a model that has to change the day a
  capability fact arrives. The seed's documentation says which kinds carry data.
- **A stale record is worse than no record.** Each record names what demonstrated
  it, so a reader can tell whether the demonstration still holds, and CI remains
  the place where a build tested claim is actually re-earned.

## Open Questions

- Whether a record should expire, and how a build tested claim is re-earned
  automatically rather than by hand.
- Whether the registry should be published as a package once there is a second
  consumer besides this repository.
