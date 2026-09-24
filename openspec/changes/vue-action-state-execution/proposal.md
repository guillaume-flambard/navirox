## Why

The current Workflow IR records action names and state kinds but no executable action semantics. The generated Vue component can therefore compile an event reference such as `save` without defining it, which blocks the behavioral T3 gate. A bounded action/state contract is required before state portability or device proof can claim behavior.

## What Changes

- Add a framework-neutral, closed action model for supported state mutations and inline event behavior.
- Preserve source provenance and refusal reasons for every action and state value.
- Emit executable state initialization and handlers from the IR without copying source-framework code into the target.
- Refuse watchers, effects, arbitrary closures, dynamic imports and other behavior outside the initial profile.
- Add deterministic behavior tests for initial state, a supported mutation, an unsupported handler and refusal provenance.

This change proves only the initial action/state profile. It does not prove device execution or a native shell.

## Capabilities

### New Capabilities

- `vue-action-state-execution`: bounded action and state behavior for the generated workflow.

### Modified Capabilities

- `workflow-ir`: action and state records carry the minimum semantics needed by a target to execute a supported profile.

## Impact

- Extends the neutral IR contract and the Vue source lowering.
- Updates the target emission contract and generated workspace verifier.
- No runtime, renderer or external service is changed.
