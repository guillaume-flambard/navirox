## ADDED Requirements

### Requirement: The target is selected from the source adapter

The convert command MUST select the target provider from the source adapter that
produced the graph, and MUST compile each screen through that provider.

#### Scenario: An Angular project uses the Angular target

- **WHEN** the source adapter is Angular
- **THEN** the command compiles each screen with the Angular target

#### Scenario: Another project uses the Vue target

- **WHEN** the source adapter is not Angular
- **THEN** the command compiles each screen with the Vue target

### Requirement: An Angular screen's template is read from its component

For an Angular screen, the command MUST read the component's template, an inline
`template:` string or the file named by `templateUrl`, and compile it. It MUST
refuse a screen whose template cannot be read with a finding and write nothing
for it.

#### Scenario: An inline template is compiled

- **WHEN** an Angular component declares its template inline
- **THEN** the command compiles that template

#### Scenario: An external template is read from its file

- **WHEN** an Angular component names a template file with `templateUrl`
- **THEN** the command reads that file and compiles it

#### Scenario: An unreadable template is refused

- **WHEN** an Angular component's template cannot be read
- **THEN** the command refuses the screen with a finding and writes nothing for it
