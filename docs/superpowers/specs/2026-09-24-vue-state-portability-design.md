# Vue State Portability Design

Date: 2026-09-24

## Context

The Vue adapter currently identifies a `defineStore` declaration as a state module, but the generic planner classifies every state module as portable without proving purity, imports or behavior. The migration engine can copy or rewrite units, but it has no Vue behavior gate and the production transform has no migration provider. This change adds an evidence-gated Pinia setup-store and pure-composable profile without putting Vue knowledge in the planner or migration engine.

## Goals

- Detect Pinia setup stores and pure composables from source syntax.
- Persist structured evidence on adapter-owned unit metadata.
- Classify a state unit as portable only when the evidence is approved.
- Copy approved units byte-for-byte through the neutral migration engine.
- Provide Pinia in the generated workspace and run a behavior fixture before final output commit.
- Report moved, manual, unknown and unresolved-import outcomes in the transform result and manifest.
- Preserve all-or-nothing behavior when verification or writing fails.

## Non-Goals

- No rewriting of stores or composables.
- No network, storage, browser, server, persistence, synchronization or platform-effect migration.
- No broad Pinia options-store, plugin, subscription, async or dynamic-import support.
- No device or visual proof. T3 and T4 remain gated.

## Evidence Contract

`source-vue` owns a typed `StatePortabilityEvidence` value attached to the discovered unit metadata. The value contains:

- `profile`: `pinia-setup` or `composable-pure`;
- `syntax`: the recognized declaration form;
- `imports`: allowed, unresolved and disallowed specifiers;
- `effects`: detected side effects and effect sources;
- `fixture`: fixture id, source hash and behavior status;
- `status`: `approved`, `manual` or `unknown`.

The first approved profile accepts Pinia `defineStore` setup functions and standalone pure composables with no relative imports. Imports are limited to `vue` and `pinia`. Dynamic imports, unresolved relative imports, async work, network, storage, timers, subscriptions, plugins and other side effects produce a non-approved status. The evidence is adapter metadata, not a shared Vue type in a neutral package.

## Classification

The generic `unit-state-module` rule no longer returns `portable` without a declared evidence contract. It returns an honest non-portable decision until a source-specific rule approves the unit.

A Vue rule at the planner source layer reads the evidence metadata. It returns `portable` only for `status: approved`; it returns `manual` or `unknown` with blockers and evidence for every other state unit. The planner remains framework-neutral and only consumes the neutral evidence shape.

## Migration Flow

1. The CLI production composition passes the Vue rule to the planner and installs a Vue migration provider at the composition edge.
2. The provider asks the neutral migration engine to plan approved `shared` or `portable` units. The approved Vue profile uses byte-preserving copy only. A unit that would require an import rewrite is not approved.
3. The provider returns planned shared files, candidate unit ids, unresolved imports, manual/unknown decisions and behavior evidence to the transform. Candidate ids are not reported as moved until verification passes.
4. Before final output commit, the transform builds a temporary workspace from generated, shared and scaffold files. The Vue provider runs the Pinia setup fixture there, creates the Pinia runtime, executes the store and asserts its initial state and action behavior.
5. Only a passing behavior result becomes `moved`. A failed fixture marks the affected unit manual/unknown, fails the run and leaves the final output untouched.
6. The transform writes all planned files and the manifest transactionally. Existing files are held, created directories are tracked, and any failure restores the complete previous output state.

## Workspace And Reporting

The generated workspace declares the tested Pinia `4.0.3` dependency, installs `createPinia` in the Vue entrypoint when a migrated Pinia unit exists, and includes the behavior verifier command. The migration report and `navirox.manifest.json` contain:

- moved file paths and unit ids;
- manual and unknown unit decisions with reasons;
- unresolved imports and affected files;
- fixture id, source hash and behavior result;
- Pinia dependency version and reason.

No unresolved import or manual decision is hidden behind a successful migration.

## Failure Handling

- Unsupported syntax or imports produce a source-located finding and no portable decision.
- A failed behavior fixture fails the transform before final output commit.
- A write or manifest-state failure restores files and removes newly created directories.
- A missing or incomplete migration report fails the transform rather than emitting a partial workspace.
- Dry-run mode performs planning and evidence checks without committing files.

## Testing

The change adds fixtures and tests for:

- pure Pinia setup stores and pure composables;
- impure stores, dynamic imports and unresolved imports;
- planner approval and refusal with persisted evidence;
- byte identity and refusal of extension rewrites for approved state units;
- behavior fixture success and failure;
- rollback after file, directory and manifest-state failures;
- real production CLI composition and manifest ownership.

The evidence document records exact commands, fixture hashes, moved/manual/unknown/unresolved outcomes and the explicit absence of device and visual claims.

## Risks And Trade-offs

- The first profile moves fewer units than the current unconditional state-module rule. This is intentional: uncertain behavior stays manual or unknown.
- Pinia is a generated-workspace runtime dependency, so its exact tested version and reason must remain visible in the manifest and evidence.
- Staging adds a verification phase to the transform, but it is required to make behavior evidence and atomic output claims truthful.
- Relative imports are deferred until the import closure and rewrite policy have their own evidence contract.
