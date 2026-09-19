## Why

React is the last of the frameworks a team is likely to bring, and it is the one
this repository is most at risk of reading wrongly. The renderer Navirox builds on
is React, React Native is React, and the identifiers in the App Graph use React's
language. An adapter for React is therefore the sharpest available test of the
boundary the architecture depends on: reading a web React application must not
become a way for the target to define the source.

There is also a plain product reason. A React web application is the most common
thing a team would want to move, and today the reading refuses it: detection finds
no adapter, so the report is empty.

## What Changes

- Add `@memolabs-apps/source-react`: detection, component discovery, state modules,
  routes from a router configuration, the shared capability scan, dependencies,
  and findings for what it does not model.
- Detection refuses a project that declares the native runtime, because a React
  Native application is not a web source and reading it as one would be exactly the
  confusion this change exists to prevent.
- Add the mirrored React fixture and extend the cross-adapter gate to it.

## Capabilities

### New Capabilities

- `source-react`

### Modified Capabilities

- None

## Impact

- New package: `packages/source-react`.
- `packages/cli`: one line at the composition root.
- Root `tsconfig.json`, `pnpm-lock.yaml`, `README.md`, `docs/evidence/`.
- Not touched: the other five adapters, the pipeline, the planner, the engine, the
  runtime packages, the acceptance app, the CI workflows.
- Out of scope: Next.js, Remix and React Router's data APIs, class components,
  higher order components, server components, concurrent features, and any
  migration transform.
