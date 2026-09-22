# companion-operational-readiness Specification

## Purpose

Declare how a proof journey behaves off the happy path. Each journey MUST state
the operational conditions that apply to it and the accessibility conditions it
was checked against, MUST keep accessibility evidence separate from a purely
visual capture, and MUST keep every deferred condition visible rather than
letting an unverified claim read as a verified one.

## Requirements

### Requirement: A proof journey declares its operational behavior

Every proof journey MUST document each operational condition relevant to its
workflow as supported, simulated, deferred, or excluded, and MUST provide an
observable result for supported or simulated conditions.

#### Scenario: A network-dependent action is in scope

- **WHEN** a proof workflow performs a network-dependent action
- **THEN** its readiness matrix states the behavior for unavailable network and request failure

### Requirement: Accessibility has evidence separate from visual capture

A proof journey MUST assess relevant text scaling, semantic labels, touch
targets, contrast, and focus or navigation behavior independently of its visual
capture evidence.

#### Scenario: Assistive behavior cannot be automated

- **WHEN** the harness cannot automate an applicable accessibility check
- **THEN** the readiness matrix records it as deferred with a manual review method and does not report it as passed

### Requirement: Deferred conditions remain visible

Published journey evidence MUST retain every deferred and excluded operational
condition and MUST NOT represent them as supported capabilities.

#### Scenario: Offline synchronization is not implemented

- **WHEN** a proof does not implement offline synchronization
- **THEN** its evidence identifies offline synchronization as deferred or excluded rather than implying a queue exists
