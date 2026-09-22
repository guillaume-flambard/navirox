## MODIFIED Requirements

### Requirement: A device evidence run keeps its provenance

Every capture MUST record the platform, the device name, the operating system
version when it is known, the source revision, the identity of the screen the
companion shows and the path of the artifact. The screen identity MUST be the
compiler version and the manifest hash of the generated screen when a target
compiler produced it, and the content hash of the hand-written screen when it
did not. A declared capture that cannot be produced MUST fail the run and record
its cause.

#### Scenario: An unavailable capture fails with its cause

- **WHEN** a declared capture is not produced for a platform
- **THEN** the run fails and the report names that capture and the reason it is absent instead of reporting a partial success

#### Scenario: A hand-written screen is identified by its own hash

- **WHEN** a journey has no target compiler and its companion shows a hand-written screen
- **THEN** the run records the content hash of that screen and states that no compiler produced it

## ADDED Requirements

### Requirement: A journey without a web counterpart still proves its behaviour

A journey whose source cannot be served as a web page MUST run its declared
workflow on a device on both platforms from one shared action sequence, and MUST
record that no web counterpart exists instead of reporting a comparison it did
not make. Every run MUST start from the declared fixed data so the first state is
reproducible.

#### Scenario: The device-only journey runs the same actions on both platforms

- **WHEN** the declared workflow is driven on iOS and on Android
- **THEN** both platforms run the same declared actions in the same order from the same starting state

#### Scenario: No web counterpart is recorded, not invented

- **WHEN** a device evidence run for a journey with no served web page reports its result
- **THEN** it states that there is no web capture to compare with and reports no measured difference
