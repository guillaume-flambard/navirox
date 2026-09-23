## Why

`navirox convert` hardcodes the Vue target. Now that a second target exists, the
command must choose the target from the source adapter, so an Angular project
converts through the Angular target. The Angular adapter reports only whether a
component's template is inline or external and never reads it, so the command
must read the component's template itself.

## What Changes

- The command selects the target provider from the source adapter that produced
  the graph: Angular uses the Angular target, anything else uses the Vue target.
- For an Angular screen, the command reads the component's template (an inline
  `template:` string or the file named by `templateUrl`) and compiles it; a
  screen whose template cannot be read is refused with a finding.
- The Vue path is unchanged.

## Capabilities

### New Capabilities

None: this extends an existing capability.

### Modified Capabilities

- `screen-conversion`: the command selects the target provider from the source
  adapter and reads an Angular screen's template from its component.

## Impact

This touches `@memolabs-apps/cli` (the convert command, its target selection and
an Angular template reader) and adds `@memolabs-apps/target-angular` as a CLI
dependency. It changes no source adapter, no target provider, no runtime seam, no
public `@memolabs-apps/*` type name and no schema version.
