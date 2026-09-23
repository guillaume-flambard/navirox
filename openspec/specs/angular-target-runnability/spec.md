# angular-target-runnability Specification

## Purpose

The emitted Angular target screen carries the component's state and runs, and is
proven end to end on a real component.

## Requirements

### Requirement: The emitted screen carries the component state

The compiler MUST translate the component's declared state into the emitted
native single-file component so that every binding in the template resolves. It
MUST refuse, with a finding and no generated source, a component whose state it
cannot translate.

#### Scenario: A bound field is declared

- **WHEN** a component declares a field the template binds
- **THEN** the emitted screen declares that field and reports no finding

#### Scenario: A method the template calls is declared

- **WHEN** a component declares a method the template calls from an event
- **THEN** the emitted screen declares that method and reports no finding

#### Scenario: State it cannot translate is refused

- **WHEN** a component's class uses a construct the translator does not
  implement
- **THEN** the compiler returns a finding and no generated source

### Requirement: The screen is proven end to end

The compiler MUST be exercised end to end on one real Angular component from a
pinned public revision, and the emitted screen MUST run on iOS and Android.

#### Scenario: A converted screen runs

- **WHEN** the proof converts the pinned component and builds the native
  application
- **THEN** the screen renders and responds to at least one declared interaction
  on both platforms
