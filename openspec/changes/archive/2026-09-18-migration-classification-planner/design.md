## Context

The graph exists, four adapters produce it, and both schemas are still version 1.
What does not exist is an opinion: nothing in the repository says a unit is
portable or that a capability needs a native replacement. That silence was the
right call while the reading was unproven, and it is now a gap, because the
product's first useful answer to a team is exactly that opinion.

The pressure on this layer is the opposite of the pressure on the adapters. An
adapter that misses something reports a finding; a planner that guesses produces a
confident wrong answer that a team will plan a release around. The design is
therefore biased towards refusal: fewer rules, each traceable, and an explicit
unknown instead of a default.

## Goals / Non-Goals

**Goals:**

- A closed classification set with confidence, reasons and evidence on every
  decision.
- A declared, total precedence order including user overrides.
- A small set of generic rules drawn only from the graph, no framework knowledge.
- A deterministic plan with a summary and a visible list of what it could not
  decide.
- One visible entry point, `navirox plan`, so the layer can be judged.

**Non-Goals:**

- Target providers and the question of what a plan is implemented against. This
  plan is target agnostic on purpose: it says what a part is, not what it becomes.
- Transforms, codemods, the migration state file, and any write to a project.
- Compatibility facts. A rule that needs to know whether a dependency works
  natively does not exist yet, and the honesty of the result depends on not
  pretending otherwise.
- Per framework rules. Every rule here is generic; the first source specific rule
  should arrive with the first source specific problem.

## Decisions

**A separate package, `@navirox/planner`.** Change 1 rejected a planner package
whose only content would have been a placeholder, and that reasoning still holds.
This change reverses the decision for the reason that was named at the time: real
logic now exists, with its own tests, and it belongs neither in the graph schema
nor in the inspection pipeline. Alternative rejected: folding the rules into
`@navirox/inspect`, which would have made reading and judging one thing and would
have put a decision in the report a reader expects to be a description.

**Every decision carries reasons and evidence, and the type enforces it.** This is
the rule that keeps the layer honest. A rule that cannot say what it read is not a
rule, and the `unknown` class is what a node gets when no rule applies, with the
reason saying so. Alternative rejected: an optional explanation, which would have
made unexplained decisions the common case within a month.

**Precedence is a declared number, not registration order.** A rule carries a
layer (override, target, source, generic, fallback) and the engine sorts by it,
then by rule id, so the outcome does not depend on the order rules happened to
load. Alternative rejected: first match wins in registration order, which is the
bug the registry was already designed to avoid for adapters.

**The rules are generic and few.** The first set covers what the graph can
actually support: a unit of shared logic with no capability use is `shared`; a
storage, geolocation, clipboard, share, notification, permission, network state or
media capture use is `adaptable`, because the native surface already has a
counterpart; a canvas or animation loop is `native-replacement`, because the role
is understood and the implementation cannot be reused; a timer or a network
request is `portable`, because the call behaves the same on both sides; a
capability with no known counterpart, including DOM access whose purpose the
reading could not establish, is `manual`; a view component is `native-replacement`, which is the
blueprint's own statement that the view layer is rewritten. Anything else, and any
dependency, is `unknown`.

**Capability decisions are the interesting ones, and the view rule is the boring
one.** A component being `native-replacement` is true of every component in every
framework, which is why the blueprint says the view layer is rewritten. The rules
that earn their place are the capability ones, because those are the parts a team
can actually keep, and they are the reason the report is worth reading.

**No target in the plan.** The plan names classifications, not a build strategy.
Naming a target would mean naming a provider that does not exist, and the PRD
makes target providers replaceable on purpose. Alternative rejected: defaulting to
`native`, which would have smuggled a strategy into a statement about source code.

**`navirox plan` is the visible proof.** A library nothing calls cannot be judged,
and the command is already promised in the blueprint's command list. It reuses the
inspection pipeline rather than adding a second one.

Contract change questions, per AGENT-GUIDE section 12:

- Why the current arrangement is insufficient: the graph is a description and the
  product's first useful answer is a judgement, and there was no layer to hold one.
- Which real consumer demonstrated the need: the `plan` command, and the migration
  engine that follows it.
- Why adapter owned metadata is not enough: a classification is about migration,
  not about a framework, and a per adapter answer would fragment the one vocabulary
  a team reads.
- Whether the schema version changes: no. The plan is a new artifact with its own
  schema version, and the App Graph stays at version 1, unread and unmodified.

## Risks / Trade-offs

- **A conservative rule set means a lot of unknowns on a real project.** That is
  the honest starting point, and the summary makes the extent visible rather than
  hiding it behind a percentage. The rules grow as compatibility facts arrive.
- **`native-replacement` for every component is nearly information free.** It is
  also true, and it prevents the alternative failure of implying a component can
  move as it is. The plan's value is in the capability rules and in the unknowns.
- **The class names are a public vocabulary.** Changing them later is a breaking
  change for a report, which is why the design document records the reasoning for
  the set that was chosen now.
- **A user override is powerful and unchecked.** It is data supplied by the user
  for their own project with a required reason, which is the same trade-off the
  blueprint makes for overrides.

## Open Questions

- Whether a plan should be scored or partitioned into phases, once a real project
  has produced one and the summary can be judged against effort.
- Whether dependency decisions belong in the plan once a compatibility registry
  exists, or whether they stay a separate question.
