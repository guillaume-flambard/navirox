# preview-public-distribution Specification

## ADDED Requirements

### Requirement: The preview names one verified consumer installation path

The developer preview SHALL name exactly one consumer installation path as
verified, and SHALL be that path only when its install and analysis steps have
been executed and their result recorded.

#### Scenario: The verified path is the executed one

- **WHEN** the developer preview states which installation path is verified
- **THEN** that path is the packed-tarball path the scaffold script performs, and
  the recorded result is the command that was run

#### Scenario: An unexecuted path is not named as verified

- **WHEN** a registry installation has not been executed successfully
- **THEN** the developer preview does not name it as a verified path

### Requirement: A public registry path is checked against the registry

The developer preview SHALL state which public packages a documented registry
path requires, and a check SHALL fail when the registry does not serve one of
them, so that a stated limitation cannot drift out of date without a failure.

#### Scenario: A documented package is missing from the registry

- **WHEN** a documented install path names a package the registry does not serve
- **THEN** the check fails and names that package

#### Scenario: The stated gap is specific

- **WHEN** the developer preview describes the public installation limitation
- **THEN** it names the unpublished packages rather than asserting only that
  installation is incomplete
