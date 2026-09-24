## Context

The current IR records state names and kinds but no initial value, and records action names without a body. The target initializes every state as `ref(0)` and can emit an event reference without a defined handler. The Vue T2 proof compiles SFCs but does not establish behavior.

## Goals / Non-Goals

**Goals:**

- Define a small neutral action/state record sufficient for state mutations and inline event behavior.
- Keep source-specific syntax in the Vue adapter and target-specific rendering in the target.
- Refuse behavior that cannot be proven within the first profile.
- Produce deterministic action output and source-located findings.

**Non-Goals:**

- Arbitrary function extraction or JavaScript interpretation.
- Watchers, effects, async requests, persistence or network calls.
- Native device execution or visual proof.

## Decisions

### Use a closed action operation set

The IR will use a closed set of operations, initially `set`, `increment` and `toggle`, each targeting a declared state record. A source handler is lowered only when it maps to one of these operations. The target renders a handler from the operation, not from copied source text.

An arbitrary expression was rejected because it would make the target a JavaScript interpreter and would turn a parser success into an unproven behavior claim.

### Carry initial values as neutral typed data

State records will carry a small neutral initial-value union for strings, numbers, booleans and empty values. The target maps that union to its runtime representation. The source adapter reads the declared initializer and refuses unsupported initializers.

### Refuse whole screens for unsupported handlers

A screen with an unsupported action is refused as a whole, matching the existing no-partial-screen policy. This keeps the target from emitting a button that appears interactive but has no behavior.

## Risks / Trade-offs

- [Profile is intentionally small] -> Add a later change for each new proven operation rather than widening this contract opportunistically.
- [Initial values may not capture computed state] -> Lower computed state only when its dependencies and result are bounded; otherwise refuse the screen.
- [Target output remains target-specific] -> Keep the operation model neutral and test it through a hand-written Workflow IR before connecting Vue syntax.

## Migration Plan

1. Add and validate the action and state fields in the IR.
2. Add the Vue fixtures and refusal cases.
3. Update target emission and generated workspace behavior tests.
4. Do not open the T3 device change until the action contract passes deterministic behavior tests.
