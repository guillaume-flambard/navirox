## Why

The target compiler exists and is proven, but no user-facing command runs it:
`@memolabs-apps/target-vue` is invoked only by proof scripts. `navirox migrate`
copies units and never emits a native screen, so the product's core promise,
converting an application, is not reachable from the CLI. This change exposes
the conversion the repository already proves.

## What Changes

- Add a `convert` command that drives the existing target provider over the
  screens of the planned graph: it emits a screen only when the provider returns
  generated source, writes the provenance record beside it, and refuses the rest
  with findings rather than emitting a partial screen.
- Keep the command dry by default and write only on `--write`, like `migrate`.
- Move the units the plan classified `shared` or `portable` unchanged, through
  the existing migration engine.
- Report every refused screen and the finding that caused it.

## Capabilities

### New Capabilities

- `screen-conversion`: a command that converts the screens a target provider
  fully supports, records their provenance, refuses the rest with findings, and
  writes only inside the output directory.

### Modified Capabilities

None.

## Impact

This touches `@memolabs-apps/cli` (a new command, its argument parsing and its
reporting) and adds `@memolabs-apps/target-vue` as a dependency of the CLI. It
reuses `@memolabs-apps/inspect`, `@memolabs-apps/planner` and
`@memolabs-apps/migrate` unchanged. It changes no source adapter, no target
provider, no runtime seam, no public `@memolabs-apps/*` type name and no schema
version, and it makes no claim beyond the subset a target provider proves.
