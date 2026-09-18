## Context

The migration engine was built and its first real runs moved nothing, because the
graph it consumes has no units that the planner would call shared. The gap is in
the adapters, and it is the kind of gap that only a real run exposes: every test
passed, because every test used the units the adapters did report.

## Goals / Non-Goals

**Goals:**

- Report plain application modules as units, in every adapter, through one shared
  predicate.
- Exclude what is not application logic by a declared rule rather than by
  judgement at each call site.
- Remove the duplication the change would otherwise create in the Nuxt adapter.
- Prove that the reading now reaches the plan and the engine.

**Non-Goals:**

- A finer classification of modules than `utility` and `state-module`. Telling a
  domain module from a utility needs a rule nobody has evidence for yet.
- Reporting declaration files. They are type surface rather than behaviour, and
  including them would inflate every summary without telling anyone anything.
- Following imports to decide whether a module is reachable. A module in the
  project is a module in the project.

## Decisions

**The predicate lives in the neutral package.** Two adapters would otherwise
answer "is this application logic" differently, and the cross-adapter comparison
would fail on a difference between two copies of the same rule rather than on a
difference between two frameworks. This is the same reasoning that moved the
capability scan. Alternative rejected: a helper per adapter, which is how the
divergence would have started.

**Exclusions are declared: tests, configuration, entry points, declarations.** Each
one has a reason that survives a reader. A test file is not shipped logic; a
configuration file describes the build rather than the application; an entry point
wires the application rather than being part of it; a declaration file has no
behaviour. Alternative rejected: a directory allowlist such as "only `src/`", which
would have missed the acceptance application, whose components and store live at
the project root.

**Entry points are excluded everywhere, not only at the project root.** A barrel
`index.ts` re-exports and an `main.ts` wires; neither is behaviour, and a rule that
depended on the file's depth would be a rule that changes meaning when a project
moves a file. Alternative rejected: excluding them only at the root, which is the
same rule with a condition nobody can explain later.

**The Nuxt adapter loses its composable rule.** The base adapter now reports those
modules, so keeping the Nuxt rule would report each of them twice under two
identifiers, which the graph would accept and a reader would not. Composition is
supposed to remove duplication; a meta-framework adapter that must delete a rule
when its base improves is composition working as intended. Alternative rejected:
deduplicating units in the Nuxt adapter, which would have hidden the redundancy
instead of removing it.

**Declaration files stay out, and that is a decision rather than an oversight.**
A `.d.ts` is shared by nature and reporting it would be defensible, but it is not
behaviour, and every summary would carry a unit count that includes types. The
model can admit it later if a real report needs it.

Contract change questions, per AGENT-GUIDE section 12:

- Why the current arrangement is insufficient: the shared class, the plan's
  summary and the migration engine all depend on a kind of unit no adapter
  produced.
- Which real consumer demonstrated the need: the migration engine's first runs, and
  the plan's summary on a real project.
- Why adapter owned metadata is not enough: whether a file is application logic is
  the same question in every framework, and the answer has to be the same.
- Whether the schema version changes: no. The unit kinds already exist; this
  change makes them occur.

## Risks / Trade-offs

- **Unit counts rise on every project.** That is the point, and it makes the old
  evidence files wrong about a number rather than wrong about a conclusion. Each
  one gets a note saying what superseded it.
- **The exclusion list will need to grow.** It is data in one place, and the next
  framework's oddity is an addition rather than a branch.
- **A module with a capability use is `adaptable` rather than `shared`**, so the
  engine still moves only the part of the logic that has no platform dependency.
  That is the honest split, and it means a project with no such module still moves
  nothing, which the report says instead of hiding.

## Open Questions

- Whether a module that imports another module with a capability use should be
  treated as touching that capability. Today the reading is per file, and the limit
  is stated rather than solved.
