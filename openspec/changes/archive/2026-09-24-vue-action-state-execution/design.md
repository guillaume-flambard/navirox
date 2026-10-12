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

Workflow IR version 3 makes action and state semantics required. An action has `kind: state-update`, `event`, `handler`, `operation`, `target`, optional typed `value` and source provenance. Event bindings carry a non-null `actionId` so the target never has to infer a handler from a raw expression. The closed operation set is `set`, `increment` and `toggle`.

A source handler is lowered only when it maps to one of these operations. The accepted grammar is an inline mutation or a named no-argument function with one mutation statement. Supported forms are a typed assignment, numeric addition/update, and boolean toggle. Parameters, `$event`, modifiers, multiple statements, arbitrary calls and unmodelled expressions are refused.

An arbitrary expression was rejected because it would make the target a JavaScript interpreter and would turn a parser success into an unproven behavior claim.

### Carry initial values as neutral typed data

State records carry a small neutral initial-value union for strings, numbers, booleans and an empty value, plus source provenance. The executable profile accepts scalar `ref` state only. The target maps that union to its runtime representation. The source adapter reads the declared initializer and refuses `computed`, `reactive`, `props`, `emits`, non-scalars and unsupported initializers.

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
