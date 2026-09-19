## Context

`@memolabs-apps/source` holds the capability vocabulary every adapter reads through,
because it describes the browser rather than a framework. Its patterns are
ordered, the first match on a line wins, and the loose pattern for a capability
sits last as a fallback.

Three adapters measured the same failure and worked around it locally. Qwik's
`src/routes/profile/index.tsx` and the two pages that destructured parameters
were written as `const { params } = useLocation()` after a first version using
`const location = useLocation()` produced four `url-navigation:unknown` entries
across two files, four lines, in a project that navigates nowhere. Lit and
Vanilla recorded the same trap in `docs/evidence/` and noted it was not fixed,
because the pattern belongs to all twelve adapters and changing it needed its own
change.

Two spellings are honest and already there: `window.open(` is navigation, and
`location.href|assign|replace` is navigation when `location` is the browser
global. The third is the problem: `\blocation\b` alone.

## Goals / Non-Goals

**Goals:**

- A local variable named `location` stops being reported as `url-navigation`.
- `window.location` in any of its forms still reports, including the bare
  `window.location` that currently reaches the loose fallback.
- The precise patterns the scan already has for other capabilities are mirrored
  for this one: a global-qualified spelling wins, and the fallback stays for what
  the qualified spelling cannot describe.
- The behaviour is asserted in the shared test file, so no adapter has to carry a
  workaround in its fixtures.

**Non-Goals:**

- Fixing a `location` that a framework genuinely resolves to navigation, such as
  a project that does `const location = window.location` and then navigates
  through it. The scan reads text, so an indirection is invisible, and that limit
  is already declared for every capability.
- Reducing other loose patterns. `geolocation`, `location` and any other bare
  name in the list are the same shape of risk, and each one needs its own
  measurement rather than a sweep.
- Changing the vocabulary: `url-navigation` stays the name, and no new capability
  is introduced.

## Decisions

**Require `window` for the loose fallback, and keep a directed pattern for the
global-qualified name.** The two directed patterns become
`window\s*\.\s*location\s*\.\s*(href|assign|replace)` and
`location\s*\.\s*(href|assign|replace)`, and the fallback becomes
`window\s*\.\s*location\b`. Rejected: deleting the fallback, which would lose
`window.location` used as an object (`window.location.reload()`, which the
existing directed pattern does not cover either, since `reload` is not in its
alternation); rejected: keeping `\blocation\b` and asking adapters to tolerate
it, which is what three adapters already did and is the state this change
exists to end.

**Leave the three fixtures alone.** Qwik's destructuring and the Lit and Vanilla
fixtures are idiomatic code, not compensation, and a fixture written to work
around a scan bug is a fixture that documents the bug. Removing the workaround
would be a change in three packages for no gain, since the scan's own test now
covers the behaviour.

**Assert both directions in `capabilities.test.ts`.** One test for the local
being silent, one for `window.location` still reporting, one for a bare
`window.location` reporting as `unknown`. This is the same shape as the existing
tests for `localStorage`, so the file keeps reading as one vocabulary with one
set of rules.

**No change to any adapter, no change to the graph.** The four contract questions
from `AGENT-GUIDE.md` section 12: the current contract is not insufficient (no
contract changes at all); the real need is demonstrated by three adapters;
adapter metadata is not the right home because the pattern is shared, not
per-framework; the schema version does not change.

## Risks / Trade-offs

**A project whose `location` genuinely is navigation and is not qualified.** The
scan can no longer see it. This is the deliberate direction: an unreported
navigation that an analysis can find by other means is better than four false
positives for every file that names a variable `location`, and the product's
rule is that a wrong positive is worse than an honest gap.

**`window.location` as an object without a property.** `window.location.reload()`
was never in the directed alternation; before this change it was caught by the
loose fallback only if written as `location.reload()`, and after this change it is
caught by the new `window\s*\.\s*location` fallback. The net effect on this
spelling is an improvement, and it is asserted.

**Other loose patterns stay.** The change is deliberately narrow. A reader could
ask why `location` and not `geolocation`; the answer is that `geolocation` as a
local name is far rarer and has not cost anything measured yet, and widening a
precision change without measurements is how a scan starts guessing.

## Open Questions

Should a project be able to declare extra capability patterns, so a framework
that wraps a browser API under its own name gets it read without editing the
shared list? Only worth answering when a second adapter needs it.
