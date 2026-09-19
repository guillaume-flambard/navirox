## Purpose

Prove that the code a migration moves runs, by carrying one real application's
journey through the migrated code on both native platforms.

## ADDED Requirements

### Requirement: The moved unit is what the application runs

The native application MUST import the unit the migration moved at the path the run
chose, and that file MUST be byte identical to what the run wrote.

#### Scenario: The application imports the migrated file

- **WHEN** the native application is inspected for the moved unit
- **THEN** the file it imports is byte identical to the file the migration run wrote

#### Scenario: The journey reads through the migrated store

- **WHEN** the product list renders
- **THEN** the products it shows come from the store the migration moved

### Requirement: The native journey is the pilot's journey

The native application MUST exercise the same acceptance journey as the pilot web
application: the product list, favouriting a product, the favourite count in the
header, the favourites view, one product detail, and the favourite surviving a
relaunch.

#### Scenario: The product list renders from the store

- **WHEN** the application has started and the store has loaded
- **THEN** the list shows every product the source data holds

#### Scenario: Favouriting a product updates the count and the favourites view

- **WHEN** a product is favourited on the list
- **THEN** the header count grows and the favourites view lists that product

#### Scenario: A favourite survives a relaunch

- **WHEN** the application is relaunched after a product was favourited
- **THEN** the favourite is still present

### Requirement: The platform specific step goes through the native API seam

A browser capability with no direct native counterpart MUST be adapted to a native
API the surface actually exposes, and the adaptation MUST be recorded as hand work.

#### Scenario: The storage capability uses a native module

- **WHEN** a favourite is written
- **THEN** it is written through a module of the native API surface and not through a browser global

#### Scenario: The adaptation is recorded

- **WHEN** the evidence report describes the journey
- **THEN** it names the module that replaced the browser capability

### Requirement: The manual work is recorded and not hidden

The change MUST record every file written or edited by hand, the reason the
migration did not write it, and every pilot capability that has no native
counterpart with what the application does instead.

#### Scenario: A hand-written file is reported

- **WHEN** the evidence report lists the application's files
- **THEN** each file written or edited by hand is named with the reason it was manual

#### Scenario: An unsupported capability is reported

- **WHEN** a pilot capability has no native counterpart
- **THEN** the report names it and says what the application does instead

#### Scenario: No claim of full automation

- **WHEN** the evidence report states the journey result
- **THEN** it states which parts the migration produced and which parts a person wrote

### Requirement: Both platforms pass the same journey

The journey MUST run from one spec on the iOS simulator and on the Android
emulator, and the existing native canary journey MUST still pass unchanged.

#### Scenario: The journey passes on both platforms

- **WHEN** the pilot spec runs on the iOS simulator and on the Android emulator
- **THEN** it passes on both without a platform specific test path

#### Scenario: The canary is unaffected

- **WHEN** the existing canary journey runs after the pilot was added
- **THEN** it passes unchanged
