## Why

React is the last source framework the roadmap lists before Astro, and React on
its own is rarely what a team actually runs. A React application is usually a Next
application, and the parts of Next that matter for a migration are the parts Next
adds: two routers that both mean something on the filesystem, a server and client
boundary expressed by a directive, and a server side that is a different runtime.

This is also the closest the source seam gets to the target. React is what the
renderer is built on, so the temptation to let that proximity shape the reading is
at its strongest here, and the adapter is written to refuse it: a project that
already declares a native dependency is not a source project at all.

## What Changes

- Add `@navirox/source-next`, composing the React adapter and reading what Next
  adds.
- Read both routers: the App Router from page files and the Pages Router from page
  modules, including nested and dynamic segments, with route groups dropped from
  the path.
- Layouts become units, because a root layout is mandatory in the App Router and
  is real application code.
- Server routes, the middleware and the configuration file are reported as
  findings; the module boundary is recorded as adapter metadata rather than a
  finding per file.
- Extend the acceptance gate with a Next comparison that is precise rather than
  weakened.

## Capabilities

### New Capabilities

- `source-next`

### Modified Capabilities

- None

## Impact

- New package: `packages/source-next`.
- `packages/cli`: one line at the composition root, and the gate.
- `README.md`, `docs/evidence/`.
- Not touched: the adapters, the neutral packages, the runtime, the acceptance
  app, the CI workflows.
- Out of scope: server actions, route handlers semantics, streaming and suspense
  boundaries, the `next.config` options, and any migration transform. Each is
  reported rather than modelled.
