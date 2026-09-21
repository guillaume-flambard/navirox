## Context

The Angular adapter reads project manifests, decorators, standalone components,
services and route arrays, and reports unsupported module-era or dynamic surfaces.
SuiteCRM 8 uses an Angular frontend extension structure and offers integration and
custom development commercially. This makes a read-only benchmark useful for both
adapter evidence and a mobile companion discovery, but not evidence that SuiteCRM
can be converted.

## Design

### Read-only external benchmark

The benchmark pins a public SuiteCRM commit and reads only source files already
available in that revision. It does not install dependencies, run SuiteCRM, use
credentials or contact a SuiteCRM instance. The profile sets route and unit
baselines only after a successful local recording.

### Mobile companion classification

A route gets a classification only from observable source signals. A route that
uses capture, attachment, status update, customer record or explicit mobile
capability may be a candidate. A complex configuration grid or an unread dynamic
surface stays desktop-only or unknown, respectively. The report names the source
path and rule for each classification.

The classification belongs in a framework-neutral report only if the Vue and
Angular paths both consume it. Otherwise it remains Angular adapter metadata and
the report renderer reads it without expanding the App Graph. The implementer must
prove this choice before changing a shared schema.

### Commercial boundary

The integrator brief describes a five-day discovery: select one field workflow,
verify API and authentication ownership, identify offline and compliance
requirements, and return a fixed-scope proposal. It does not promise a SuiteCRM
mobile app or use a customer name.

## Rejected alternatives

- A native Angular target: rejected until the Vue visual-fidelity gate supplies a
  proven target contract.
- Scoring routes from names alone: rejected because a route called "visit" is not
  evidence of a mobile workflow.
- Running a public SuiteCRM instance: rejected because a source benchmark must be
  deterministic and credential-free.

## Contract change questions

Decision: the mobile companion classification stays Angular adapter metadata and no
shared contract changes. It travels on `DiscoveredUnit.metadata.mobileReadiness`,
the field the neutral contract already documents as framework specific detail, and
`buildFragment` copies that metadata verbatim into `UnitNode.metadata`, so the
classification reaches the inspection report without a new field. The four
questions of the agent guide answer as follows:

- Why the current contract is insufficient: it is not. The metadata field exists
  precisely for detail an adapter owns, and the App Graph already carries it.
- Which real adapter or target demonstrated the need: only the Angular adapter, and
  only for this discovery question. The Vue path has no equivalent semantic; its
  gate is about what the target compiler supports, not about whether a screen is a
  mobile workflow.
- Why adapter metadata is insufficient: it is not insufficient. A neutral contract
  would need a second adapter making the same semantic decision and a user-visible
  consumer that both share; neither exists in this change.
- Whether the schema version changes: no. The App Graph stays at version 1 and
  `SourceInspection` gains no field.

If a second adapter later needs the same candidate, desktop-only and unknown
decision, that is the moment to move the vocabulary into a neutral contract, with
the schema version decision recorded then. SuiteCRM is the real adapter evidence,
not a reason to generalise early.

