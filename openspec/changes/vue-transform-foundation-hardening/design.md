## Context

The merged T2 path has a real adapter and target seam, but its serialized binding shape cannot distinguish literal text from an expression. The transform result also has a spec mismatch for mixed refusals, and the generated command list advertises native commands that the generated package does not expose. The current target package metadata still names the source side even though its implementation imports only the neutral IR. The production CLI also contains framework-specific workspace construction instead of composing a declared workspace provider.

## Goals / Non-Goals

**Goals:**

- Make literal and expression values explicit in the Workflow IR and target rendering.
- Make incomplete transform results atomic and consistent with the product rule that incomplete output is not written.
- Enforce the source/target seam in package metadata as well as source imports.
- Keep framework-specific workspace construction behind a provider seam and keep the neutral CLI composition provider-driven.
- Make generated reproduction commands reflect commands the generated workspace actually provides.
- Reconcile the T2 review, evidence and backlog before archival.

**Non-Goals:**

- No new router, state, action or style profile.
- No native shell, iOS/Android build, browser behavior or visual fidelity.
- No migration of arbitrary Vue code or external repository support.

## Decisions

### A typed binding value is the smallest honest contract

The real Vue adapter needs to preserve static text such as `Hello world`; the current target rendered that text as `{{ Hello world }}`, which is not the same value. The IR therefore adds an explicit value kind to bindings, `literal` or `expression`, and updates stable serialization and validation. The schema version changes because old serialized bindings cannot be interpreted safely.

Adapter metadata is insufficient because the distinction is consumed by the target and is observable in generated output. The real Vue adapter and neutral target demonstrated the need. A magic binding name was rejected because it repeats string interpretation across lowering and emission and makes the schema ambiguous.

### A refused screen makes the transaction fail

The product contract says an incomplete output is an error. The transform module therefore treats any non-generated screen as a refusal, returns `ok=false`, preserves the planned paths for diagnosis, and returns before the write loop. The T2 spec and evidence are corrected to describe the empty output.

Partial writes were rejected because a generated subset could be mistaken for a complete workflow. The transform result remains useful in dry-run mode because it reports the planned path list and all refusal findings without writing.

### Target metadata follows the import boundary

`target-native` removes its source dependency and TypeScript reference. The boundary check will inspect package metadata as well as source imports. A target may depend on `@memolabs-apps/workflow`, but not on `@memolabs-apps/source` or a source adapter.

### Workspace construction follows the provider seam

The production transform composition will consume a declared workspace-provider contract. Vue-specific workspace construction, source framework imports and source-specific file conventions will live in the provider implementation, not in a neutral CLI module. The provider also returns the package-local commands exposed by its generated workspace, so the CLI does not invent a compiler or native command. The CLI will compose providers and report results without knowing which source framework generated the workspace.

A metadata-only or string-obfuscation workaround was rejected because it leaves framework knowledge in the wrong layer and cannot be enforced by an import-boundary test.

### Reproduction commands describe the generated package

The compiler-only generated workspace exposes an SFC verification command. Its manifest will list that command and will not claim native build commands until the generated package provides them. A later native-shell change may add commands with its own evidence gate.

## Risks / Trade-offs

- [Schema migration cost] -> Refuse unknown old binding shapes with a named finding rather than guessing, and keep the migration explicit in the change.
- [Stricter transform result] -> Existing mixed-refusal tests and T2 evidence must be updated to the all-or-nothing contract.
- [T2 workspace remains compiler-only] -> Keep the limitation in evidence and do not describe the workspace as native or behaviorally proven.
- [Target package reference removal] -> Run package-boundary and full build checks before archival.

## Migration Plan

1. Add the typed binding value and versioned serialization tests in the neutral IR package.
2. Update Vue lowering and target emission to consume the typed value.
3. Move Vue-specific workspace construction behind a provider contract and make the production CLI composition provider-driven.
4. Make transform refusal atomic and update the T2 spec, test and evidence.
5. Remove target source metadata and extend the boundary check.
6. Reconcile the backlog and rerun strict OpenSpec validation and the full baseline.
7. Keep the completed Vue changes archived and use this hardening change as the prerequisite for the next profile change.
