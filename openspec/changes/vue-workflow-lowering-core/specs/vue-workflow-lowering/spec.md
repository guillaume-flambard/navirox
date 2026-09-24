## Purpose

How the Vue source adapter lowers a selection of an analysed Vue application into
the framework-neutral Workflow IR, what it covers, and how it refuses what it does
not.

## ADDED Requirements

### Requirement: The Vue adapter lowers into the Workflow IR

`@memolabs-apps/source-vue` MUST expose a `SourceTransformProvider` whose `lower`
turns a selection of the analysed application into a `Workflow`. The provider MUST
read the screen units the App Graph names and MUST NOT import a target provider or
the runtime.

#### Scenario: A lowering produces a workflow

- **WHEN** the lowering is asked to lower a selection whose graph names a screen
  unit with a readable file
- **THEN** it returns a `Workflow` whose screen id derives from the graph screen
  id and whose nodes carry a source location

#### Scenario: The adapter imports no target

- **WHEN** the source-vue package's imports are checked
- **THEN** no module imports a target provider, a renderer or the runtime

### Requirement: The covered profile is lowered

The lowering MUST lower the declared profile: `<script setup>` state (`ref`,
`reactive`, `computed`, `defineProps`, `defineEmits`), template interpolation,
property bindings, `v-if`/`v-else`, `v-for`, event handlers, `v-model` and elements
with a known primitive mapping. Every emitted node MUST carry a `generated`
coverage and a source location.

#### Scenario: Covered state and template become IR nodes

- **WHEN** a screen uses a covered `ref`, a `computed`, an interpolation, a
  `v-if`, a `v-for`, an event handler and a `v-model`
- **THEN** the lowering emits state entries, view nodes, bindings and actions for
  each, all with `generated` coverage and a source location

### Requirement: An uncovered construct is refused as a whole screen

When a screen uses a construct outside the profile, the lowering MUST set that
screen's coverage to `refused`, emit no node for it, and record a finding with the
source location of the refused construct. It MUST NOT emit a partially lowered
screen.

#### Scenario: A render function refuses the screen

- **WHEN** a screen uses a render function, a dynamic component or a watcher
- **THEN** the screen's coverage is `refused`, its nodes are empty, and a finding
  names the construct and its source location

#### Scenario: An unreadable screen file is refused

- **WHEN** the graph names a screen unit whose file cannot be read
- **THEN** the screen's coverage is `refused` and a finding names the file

### Requirement: The lowering is deterministic

The same selection, snapshot and profile MUST produce the same serialized workflow
and the same hash.

#### Scenario: Two runs produce identical bytes

- **WHEN** the same input is lowered twice
- **THEN** `serializeWorkflow` returns identical bytes and `hashWorkflow` returns
  the same hash
