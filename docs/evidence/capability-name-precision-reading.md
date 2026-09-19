# The shared scanner, and the word it read too easily

Three adapters measured the same failure and each one worked around it in its own
fixture. This change fixes the scan instead, which is where the failure lived.

## The question, and the answer

The shared capability scan reports what a file does with the browser. It is shared
on purpose: it lives in `@memolabs-apps/source`, it reads plain source text, and it is
what makes a Vue report and a Qwik report comparable at all. Its vocabulary is
declared once and every adapter reads through it.

One pattern in that vocabulary was too wide. `url-navigation` had a directed
pattern for the write spellings, and behind it a fallback that matched the bare
word:

```
{ capability: 'url-navigation', usage: 'write',   match: /\blocation\s*\.\s*(href|assign|replace)/ },
{ capability: 'url-navigation', usage: 'unknown', match: /\blocation\b/ },
```

The fallback exists for a good reason. A line like `window.location.reload()` reads
the platform object without a direction, and reporting `unknown` is honest where
reporting nothing would not be. But the fallback named the word rather than the
object, so any identifier sharing that name was read as browser navigation.

## What it cost, measured

The Qwik adapter hit it first. A Qwik page reads its parameters through
`useLocation()`, and a page binding the whole result to a local named `location`
added four spurious `url-navigation:unknown` entries, twice per page: once on the
binding line and once on the use line. The fixture was written to destructure
`const { params } = useLocation()` instead, which is the idiomatic way to read one
parameter and happens not to bind the trap word. The five expected capabilities came
back exactly.

Lit and Vanilla recorded the same trap and left the pattern alone, because it
belongs to the neutral scanner rather than to any one framework, and because
narrowing it changes how all twelve adapters read a word that is genuinely the
browser global in some files and a local variable in others.

## What changed

The fallback names the global now, and a qualified directed pattern was added ahead
of the unqualified one:

```
{ capability: 'url-navigation', usage: 'invoke',  match: /\bwindow\s*\.\s*open\s*\(/ },
{ capability: 'url-navigation', usage: 'write',   match: /\bwindow\s*\.\s*location\s*\.\s*(href|assign|replace)/ },
{ capability: 'url-navigation', usage: 'write',   match: /\blocation\s*\.\s*(href|assign|replace)/ },
{ capability: 'url-navigation', usage: 'unknown', match: /\bwindow\s*\.\s*location\b/ },
```

Four patterns instead of three, and the shape it buys:

| Line                        | Before                                              | After                          |
| --------------------------- | --------------------------------------------------- | ------------------------------ |
| `const location = useLocation()` | `url-navigation:unknown`                        | nothing                        |
| `window.location.href = url` | `url-navigation:write`                             | `url-navigation:write`         |
| `location.assign(url)`       | `url-navigation:write`                             | `url-navigation:write`         |
| `return window.location`     | `url-navigation:unknown`                           | `url-navigation:unknown`       |
| `window.location.reload()`   | `url-navigation:unknown` (the bare-word fallback)  | `url-navigation:unknown` (the global fallback) |

The net is an improvement rather than a swap, because the qualified write pattern
never covered `window.location.reload()` either; the fallback did, and the narrower
fallback still does.

## Why the local spelling stays

`location.href = url` and `location.assign(url)` are still read as navigation when
the word is not qualified. That is deliberate. On a browser page the bare
`location` is the global, and a project that navigates through it is doing exactly
what the capability describes. The change removes the case where the word is
something else, not the case where it is the platform.

What it does not catch is a project that assigns `const location = window.location`
and then navigates through the local. That aliasing is a hole, and it is a hole by
the same rule as the one being fixed: a report should not claim a fact it did not
read.

## What was deliberately not done

- No adapter source changed, and no fixture changed. The Qwik destructuring and the
  Lit and Vanilla fixtures are idiomatic code, and a fixture written to work around
  a bug is a fixture that documents the bug; leaving them means the fix is proven by
  the shared test rather than by three local edits.
- No other wide pattern was narrowed. `geolocation`, `localStorage` and the DOM
  fallback each have their own balance to strike, and widening or narrowing one
  without its own measurement is how a scan starts guessing.
- No change to the capability vocabulary, to any graph type, or to App Graph, which
  stays at version 1.

## Proof

| Command                                          | Result                                     |
| ------------------------------------------------ | ------------------------------------------ |
| `pnpm --filter @memolabs-apps/source build`            | clean                                      |
| `pnpm --filter @memolabs-apps/source test`             | 6 files, 42 tests (39 before, three added) |
| the three added tests                            | a local named like a global reports nothing, `window.location` still reports, the global without a direction is still `unknown` |
| `pnpm build`                                     | 29 packages                                 |
| `pnpm typecheck`                                 | 54 tasks                                    |
| `pnpm test`                                      | 53 tasks                                    |
| `pnpm lint`, `pnpm format:check`, `pnpm deps:check` | clean                                    |
| Detox, both platforms                            | 4 of 4 on the emulator and 4 of 4 on the simulator |
