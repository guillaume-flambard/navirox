## Why

The shared capability scan reports `url-navigation` for the bare word `location`,
so an ordinary local named `location` reads as browser navigation. Qwik, Lit and
Vanilla each hit it while measuring: `const location = useLocation()` added four
`url-navigation:unknown` entries to a fixture that navigates nowhere, and the
adapters worked around it in their own fixtures instead of the scan being fixed.
The pattern is shared vocabulary, so the workaround is repeated in every project
the tool reads rather than in one file.

The same looseness exists one line up: `\blocation\s*\.\s*(href|assign|replace)`
matches a local called `location` too. And the loose fallback sits last in the
pattern list, so a line that mentions `location` and nothing more specific is
still reported as navigation.

## What Changes

The scan reports `url-navigation` only for the spellings that reach the browser:
the global `window.location`, the bare `location.href|assign|replace` forms the
browser platform defines, and `window.open(`. A `location` that is a local
variable is no longer read as navigation, and the loose fallback is narrowed to
the global instead of removed, so `window.location` alone still reports.

The workarounds the three adapters wrote into their fixtures stay in place, since
they are idiomatic code rather than compensation, but the behaviour that caused
them is asserted in the shared scan's own test file so no adapter has to carry it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `capability-read`: the shared scan gains a pattern-precision requirement. The
  capability exists because the scan is what every adapter reads capabilities
  through, and its declared vocabulary is what makes two reports comparable.

## Impact

`packages/source/src/capabilities.ts` (the `url-navigation` patterns and their
docstrings), `packages/source/src/capabilities.test.ts` (the behaviour asserted),
and `docs/evidence/` (the three existing evidence files say the trap is
unfixed; they get a closing note). No adapter source changes, no fixture
changes, no graph type changes: the App Graph stays at version 1, and the
analysis of every other framework is unchanged except that a local named
`location` stops being reported as navigation. No dependency is added, and no
changeset is written, since nothing is published.
