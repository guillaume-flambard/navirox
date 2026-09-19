## Purpose

Define how precise a declared capability name must be, so that the shared scan
reports what a project reaches in the browser rather than what a local variable
happens to be called.

## ADDED Requirements

### Requirement: A capability pattern names the browser object it reads

A declared capability pattern MUST match the spelling that reaches the platform
and MUST NOT match an identifier that merely shares a name with it. A pattern
whose platform spelling is a property of a global MUST require that global.

#### Scenario: A local named like a browser global is not a capability

- **WHEN** inspection reads a file that declares a local variable named after a
  browser global
- **THEN** no capability is reported for that line

#### Scenario: The global form is still reported

- **WHEN** inspection reads a file that reaches the browser through that global
- **THEN** the capability is reported, with the usage that spelling implies

### Requirement: Narrowing a pattern does not remove the fallback

When a capability keeps a deliberately loose pattern as its last resort, that
pattern MUST stay narrower than any identifier of the same name, so a project
that uses the capability with no readable direction is still reported as
`unknown`.

#### Scenario: A use with no direction stays unknown

- **WHEN** inspection reads a file that names the platform object without any
  method or property to read the usage from
- **THEN** the capability is reported with the `unknown` usage

#### Scenario: A local of the same name is not reported

- **WHEN** inspection reads a file whose only mention of that name is a local
  variable
- **THEN** neither a directed use nor an `unknown` use is reported for it
