# Design: companion operational readiness

## Decision

Each proof journey will carry an operational-readiness matrix. It evaluates the
workflow's relevant conditions: no network, request failure, session expiry,
attachment interruption, recovery/reset, text scaling, screen-reader semantics,
touch target, contrast, and focus/navigation. Each row has one of four outcomes:
supported and tested, simulated and tested, deliberately deferred, or excluded.
Deferred and excluded rows remain visible in published evidence.

The matrix is a proof contract, not a claim that Navirox provides generic auth,
offline sync, or accessibility automation. It only turns silent assumptions into
testable behavior or an explicit limitation.

## Alternatives considered

- Test only the happy path: rejected because it cannot distinguish a usable
  companion from a fragile demonstration.
- Make all operational cases mandatory now: rejected because it would turn a
  bounded proof into an undeclared product program.
- Treat visual capture as accessibility evidence: rejected because a screenshot
  cannot establish semantic labels, assistive navigation, or usable focus.

## Contract change

No shared software contract changes. The matrix is evidence documentation and
acceptance coverage; implementation-specific APIs remain in their existing seams.
