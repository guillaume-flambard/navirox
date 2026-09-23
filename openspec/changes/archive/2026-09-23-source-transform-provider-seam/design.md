## Context

See `proposal.md` - Why. `@memolabs-apps/source` already owns the neutral source
seam (the adapter contract, the forbidden import list and the static boundary
check), and `@memolabs-apps/workflow` now owns the IR. What is missing is the two
entry points that meet at that IR and the check that keeps them apart.

## Goals / Non-Goals

**Goals:**

- One lowering entry point and one emission entry point, meeting at the IR.
- A static check that fails when either side imports across the seam.
- A fake lowerer and a fake target, so the seam is proven before a second real
  framework exists.

**Non-Goals:**

- Implementing a real lowering (that is the Vue lowering change) or a real target
  emission.
- Changing the graph, an adapter's public API or the runtime seam.

## Decisions

### The lowering contract lives in `@memolabs-apps/source`

`lower()` is declared beside the adapter contract it extends, so every adapter
sees one interface. It returns the IR and a coverage report.

Rejected: putting the lowering contract in `@memolabs-apps/workflow`. The IR
package stays a data contract with no opinion about who produces it.

### Emission is declared by the target side, not by the IR

A target declares `emit(workflow, targetProfile)`. The IR package does not name a
target.

Rejected: a single orchestrating interface owning both halves, which would
re-weld the seam this change exists to keep open.

### The asymmetry is checked, not documented

The existing forbidden-list check gains the two new directions: an adapter may
name its framework but never a target or the runtime, and a target may name the
renderer but never a source framework.

Rejected: relying on review. A rule that only lives in prose is a rule that gets
broken quietly.

### Contract change questions

This change introduces one new contract (`source-transform-provider-seam`) and
uses the existing `workflow-ir` contract. It changes no graph concept, no existing
schema version and no public `@memolabs-apps/*` name. The need is demonstrated by
the next changes: a Vue lowering and an IR-driven target emission, which must meet
without either naming the other.

## Risks / Trade-offs

- The interface could grow a framework-shaped field -> a test asserts two
  contrasting providers share one interface.
- The check could be bypassed by a re-export -> the check reads the specifier, not
  a resolved value, so a re-export fails it too.
