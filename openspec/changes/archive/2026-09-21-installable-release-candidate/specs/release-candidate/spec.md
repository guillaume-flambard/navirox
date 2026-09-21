## Purpose

Define what identifies a release candidate for this project, what its packed
artifacts must do outside the repository, and what its notes must say. A tag and a
workspace build do not establish that a user can install the product.

## ADDED Requirements

### Requirement: One version identifies the candidate

Every publishable workspace MUST carry the same release version, that version MUST
come from a recorded changeset rather than from hand-edited manifests, and the
private root manifest MUST stay out of the release.

#### Scenario: Every publishable workspace shares the version

- **WHEN** the candidate version is applied
- **THEN** every publishable workspace manifest records that version and the private
  root manifest still records its own

### Requirement: The candidate is tagged on the commit that produced it

The candidate commit MUST carry a tag, and no existing tag may be moved or deleted.
Where an existing tag names a different commit or a package scope the project has
abandoned, the notes MUST say so.

#### Scenario: The candidate is tagged

- **WHEN** the candidate commit is tagged
- **THEN** the tag resolves to the commit whose artifacts were packed and verified

#### Scenario: Existing tags are left in place

- **WHEN** the candidate is tagged
- **THEN** every tag that already existed still resolves to the commit it named
  before, and any tag that names an abandoned scope or a different commit is
  described in the notes rather than repaired

### Requirement: The candidate installs outside the workspace

The packed artifacts MUST install into a directory outside the repository with no
workspace link and no missing package, and the installed command line entry point
MUST answer.

#### Scenario: A clean install outside the workspace succeeds

- **WHEN** the packed artifacts are installed into an empty directory outside the
  repository
- **THEN** no Navirox entry resolves back to the checkout and every package the
  application imports is present

#### Scenario: The installed entry point answers

- **WHEN** the installed command line entry point is run in an application created
  from the artifacts
- **THEN** it reports on the environment through the doctor command

### Requirement: The installed candidate is exercised on the documented path

The artifacts MUST be driven through the scaffold, doctor, inspect, plan and migrate
commands, and the transcript MUST be recorded as evidence.

#### Scenario: The documented commands run from the artifacts

- **WHEN** the documented commands are run against a project created from the
  artifacts
- **THEN** each one completes and the observed output is recorded

### Requirement: The notes and the code agree

Release notes MUST state the prerequisites, what the candidate does, what remains
manual, the publication sequence and the verification that follows publication. A
claim in the notes MUST match the behaviour of the candidate.

#### Scenario: The notes state the limitations

- **WHEN** the notes describe what the candidate does
- **THEN** every capability named is one the candidate was observed to perform, and
  the work that stays manual is named as manual

#### Scenario: Publication is a separate step

- **WHEN** the candidate is prepared
- **THEN** the notes state that publishing is a separate action performed afterwards
  and what must be checked once it has been performed
