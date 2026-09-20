# Vue route reading

The Vue source adapter reads a route only when it can establish all of the
following from source code:

- an import of `createRouter` from `vue-router`;
- a direct call to that imported binding;
- a literal options object with a literal `routes` array; and
- a top-level literal route object with a literal `path`.

It normalizes relative and empty paths and records named `:parameters`. It does
not execute router configuration or infer a route from a `views` directory.
Computed arrays, spreads, computed paths and nested children produce findings
instead. That keeps an incomplete inspection explicit rather than turning a
plausible-looking route into an unsupported claim.

`@memolabs-apps/source-vue` now ships `typescript@~6.0.3` as a runtime
dependency. The adapter uses the TypeScript AST parser at inspection time to
establish those syntax boundaries. The version is deliberately the same pinned
compiler line already used to build the package; no project code is evaluated.

Verification for this change:

```bash
pnpm --filter @memolabs-apps/source-vue test
pnpm --filter @memolabs-apps/source-vue typecheck
pnpm --filter @memolabs-apps/cli test -- adapters.test.ts
```
