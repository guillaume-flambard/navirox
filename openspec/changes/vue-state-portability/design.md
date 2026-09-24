## Context

The default production transform has no migration provider, and the generic planner treats state modules as portable based on parsing. The product contract requires evidence before a unit can move. Vue-specific knowledge must remain in the source adapter or a declared Vue planner policy, while the migration engine remains generic and atomic.

## Goals / Non-Goals

**Goals:**

- Define a Vue state evidence gate covering supported declarations, pure behavior, imports and side effects.
- Move approved units unchanged through the existing migration engine.
- Keep manual, unknown and unresolved work visible in the transform result and manifest.
- Prove behavior with fixture tests before a unit is marked generated-and-proven.

**Non-Goals:**

- No rewriting of stores or composables.
- No network, storage, browser, server or platform side-effect migration.
- No broad migration claim beyond the exact Vue profile.

## Decisions

### Keep the policy in a Vue-specific evidence rule

The source adapter identifies state and composable units. A Vue-specific planner rule evaluates the declared profile and returns evidence-backed decisions. The neutral migration engine only consumes the decision and moves files. The engine does not import Vue or interpret Vue syntax.

An adapter metadata-only solution was rejected because migration behavior and the user-visible manual report consume the decision, and the evidence must survive beyond the inspection phase.

### Move unchanged only

Approved units are copied byte-for-byte. Any transformation, import rewrite or wrapper is a separate declared extension and is not part of this change. This preserves the existing migration engine contract and avoids hiding source edits in a generic transform.

### Behavior fixtures gate the decision

A unit is eligible only after its fixture acceptance test passes in the output workspace. A failure is atomic and leaves the output untouched, consistent with the existing rollback requirement.

## Risks / Trade-offs

- [Fewer units will move] -> Report the excluded reason; do not broaden the gate without evidence.
- [Vue policy can drift from the generic engine] -> Keep the policy in a named Vue capability and test the engine with a hand-written decision fixture.
- [Behavior tests may require generated runtime pieces] -> Keep fixtures synthetic and local to the state profile; defer device journeys to T3.

## Migration Plan

1. Add Vue state and composable fixtures with pure, impure, unresolved and dynamic cases.
2. Add the evidence rule and update the production transform composition.
3. Run the migration engine behavior and rollback tests.
4. Record moved, manual and unknown units in the generated manifest.
5. Run the full baseline before opening any device proof.
