# angular-mobile-readiness Specification

## Purpose
Report what an Angular application is ready for without overclaiming it. The
Angular adapter or its report renderer SHALL classify an observed route or unit as
candidate, desktop-only or unknown only when the classification names its source
location and rule, and no classification MAY imply automatic portability, so that
a readiness report is a set of attributable observations rather than a promise
about the port.

## Requirements

### Requirement: Angular reports mobile companion readiness with evidence

The Angular adapter or its report renderer SHALL classify an observed route or unit
as candidate, desktop-only or unknown only when the classification names its source
location and rule. No classification MAY imply automatic portability.

#### Scenario: A field-oriented route is a candidate

- **WHEN** an inspected Angular route has an observed record update, attachment or device-capability signal
- **THEN** the report classifies it as a candidate and names the source evidence

#### Scenario: A dynamic surface remains unknown

- **WHEN** an inspected Angular surface is dynamic or unread by the adapter
- **THEN** the report classifies it as unknown and names the unread surface

### Requirement: Desktop configuration work is not represented as a mobile promise

A route or unit that implements an observed configuration grid or administration
surface MUST be classified desktop-only unless separate source evidence establishes
a mobile workflow.

#### Scenario: A configuration grid is excluded

- **WHEN** the fixture's configuration surface is inspected
- **THEN** the report classifies it desktop-only and does not mark it portable
