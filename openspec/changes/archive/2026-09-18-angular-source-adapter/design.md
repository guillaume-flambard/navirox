## Context

Four adapters, one pipeline, one model, and a gate that holds two of them to the
same report shape. What none of them stress is a framework that does not look like
the others: every adapter so far reads files whose format a framework defines, and
gets its structure from a directory convention.

Angular is different in three ways that matter to a neutral model. Structure comes
from decorators rather than from file names, so the reading has to be about
declarations. State does not come from a store library but from what a service
class holds, so the state module kind has to be decided by content. And routing is
TypeScript rather than a directory, so routes are read from code.

## Goals / Non-Goals

**Goals:**

- Detection, components, services, pipes and routes for Angular, through the same
  neutral vocabulary the other adapters use.
- A mirrored fixture, so the gate can compare Angular against Vue and Svelte.
- An answer to the question the change exists for: did the model need anything new.

**Non-Goals:**

- NgModules. The decorator is reported and nothing else; the adapter targets the
  standalone era, and a project that leans on modules is told so.
- Nested routes and lazy loading. Children are reported as findings rather than
  resolved into paths, because resolving them means evaluating a configuration.
- Templates. Whether a template is inline is read; its content is not parsed, and
  an external template file is a finding.
- Signals, RxJS semantics, forms, Angular Material, and any migration transform.

## Decisions

**Structure comes from decorators.** The file name decides nothing. A file named
`user.component.ts` that declares no component is not a component, and a component
that lives in `widgets/` is one. Angular's own compiler agrees with the decorator
rather than with the name, and a reading that disagreed with the compiler would be
wrong in the way that is hardest to notice. Alternative rejected: name based
discovery, which would have been faster to write and would have reported files that
Angular itself does not treat as components.

**The injectable kind is decided by what the class holds.** A service that holds
reactive state is a state module; one that does not is a utility. This is the first
time an adapter has to tell state from behaviour by reading rather than by looking
for a library import, and it is recorded as a decision because it is a judgement:
Angular has no store library, and pretending a service is a store would have made
every Angular service a state module. Alternative rejected: reporting every service
as a utility, which would have hidden the state a migration has to carry.

**Routes are read from the routes file, at the top level only.** A `path` literal
is a fact; a child array under it is a nested configuration the adapter does not
resolve, and `loadChildren` is a function call rather than data. Reporting the top
level and a finding for the rest keeps the reading true. Alternative rejected:
resolving children by concatenating paths, which would have produced patterns that
are right until the day a guard or a redirect changes them.

**The fixture mirrors the same journey as the others.** The gate's whole value is
that two reports are compared against one shape, and a fixture that told a
different story would have made the comparison meaningless. Alternative rejected: a
fixture that showed off Angular's features, which would have proven nothing about
the model and everything about the fixture.

**No new concept, or the gate has failed.** If Angular needed a new node kind or a
new shared concept, that would be the finding this change is looking for, and it
would be written down rather than added quietly. The design assumes it will not,
and the evidence records whether that held.

Contract change questions, per AGENT-GUIDE section 12:

- Why the current arrangement is insufficient: nothing had yet tested the model
  against a framework where structure, state and routing all come from somewhere
  other than a file convention.
- Which real consumer demonstrated the need: the Angular adapter and the extended
  gate.
- Why adapter owned metadata is not enough: a decorator name is metadata, but
  whether a class holds state is what a state module is, and that has to be the
  same vocabulary in every report.
- Whether the schema version changes: no, and a change would mean the gate failed.

## Risks / Trade-offs

- **Decorator detection by scanning text is a heuristic.** A decorator in a comment
  is not a decorator, so the scan strips comments, and a decorator the scan misses
  is a missing unit rather than a wrong one. Running the Angular compiler would be
  stronger and would add a toolchain to a reading step, which the Svelte adapter
  already declined for the same reason.
- **The state module rule is a judgement with a plausible alternative.** It is
  recorded, and the cost of being wrong is a unit reported as a utility that a
  later rule could reclassify.
- **Angular majors move quickly.** The adapter declares the majors it was tested
  against and reports anything else, which is the mechanism the other adapters
  already use.
- **A fixture comparison can be tuned until it passes.** The Angular fixture mirrors
  the others component for component and service for service, and the gate compares
  kinds and capabilities rather than counts.

## Open Questions

- Whether reading templates would change the capability reading enough to justify
  parsing them, once a real Angular project is available to measure it.
- Whether a service that injects a stateful service inherits its state classification,
  which the per file reading does not answer today.
