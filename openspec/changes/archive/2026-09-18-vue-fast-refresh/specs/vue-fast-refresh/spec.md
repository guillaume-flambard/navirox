## Purpose

Navirox compiles Vue single file components into modules a native device runs, and every edit to one of them used to take the whole application down and build it again. This capability is the development-time registration that hands a changed component to Vue's own HMR runtime, so the change lands in the running application and the state that is not the component's own survives it.

## ADDED Requirements

### Requirement: The compiled component registers itself with Vue's HMR runtime

A single file component compiled by the Navirox transform SHALL carry a stable `__hmrId` on the component it exports, and SHALL register that component with `__VUE_HMR_RUNTIME__` while the module is evaluated, which is before any instance of it can be mounted.

#### Scenario: the transformed module registers the component it exports

- **WHEN** a `.vue` file is transformed and the development runtime is present
- **THEN** the module sets `__hmrId` on its default export and calls `createRecord` with that id and that component

#### Scenario: the record exists before the first instance mounts

- **WHEN** the transformed component is the application root and the module is evaluated before the application mounts
- **THEN** the record exists by the time Vue mounts the root instance, so that instance is tracked by the runtime

### Requirement: An accepted update re-renders in place instead of reloading the application

The transformed module SHALL declare itself a Metro hot boundary and SHALL apply the update through Vue's HMR runtime, rather than letting the change fall through to a full reload.

#### Scenario: editing a component keeps the application mounted

- **WHEN** a component's source changes while the application runs and the development server pushes the update
- **THEN** the module's own accept callback calls `reload` with the component from the newly evaluated module, and the application is not unmounted

#### Scenario: state that is not the component's own survives the update

- **WHEN** a component is edited while the application state lives in a store outside it
- **THEN** the store is the same store after the update and the values in it are the values it held before

### Requirement: The registration is inert where the development runtime is absent

The injected registration SHALL do nothing when either the bundler's hot runtime or the framework's HMR runtime is absent, and SHALL NOT require a flag, a conditional or any other change in application code.

#### Scenario: a build without the hot runtime behaves as before

- **WHEN** a module produced from a component is evaluated where there is no hot runtime
- **THEN** it exports the same component and performs no registration

#### Scenario: no application code is conditional on the mode

- **WHEN** an application is built for a device instead of served by the development server
- **THEN** the difference is the absent runtime and nothing else, with no Navirox flag in the application

### Requirement: The identifier is derived from the component's file and does not move

The identifier SHALL be derived from the path of the file the component came from, so that it is the same identifier across edits of that file and a different identifier for any other file.

#### Scenario: editing a file does not change its identifier

- **WHEN** the same file is transformed twice with different contents
- **THEN** both transformed modules carry the same identifier

#### Scenario: two files never share an identifier

- **WHEN** two different components are transformed
- **THEN** their identifiers differ

### Requirement: The registration is delivered by the package that owns the Vue build integration

The plugin SHALL be exported by `@navirox/metro-preset`, and the application's Babel configuration SHALL be the place it is enabled. No component SHALL carry the registration in its own source.

#### Scenario: the shipped and scaffolded apps enable it in their Babel configuration

- **WHEN** the example application and an application produced by the scaffolder are built
- **THEN** each takes the plugin from `@navirox/metro-preset` in its `babel.config.js`

#### Scenario: a real bundle contains the registration

- **WHEN** the example is bundled through Metro in development mode
- **THEN** the output contains the registration, which is what proves the plugin ran inside the real transformation pipeline and not only in a unit test
