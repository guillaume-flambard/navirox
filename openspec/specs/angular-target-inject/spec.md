# angular-target-inject Specification

## Purpose

How a bounded Angular `inject(Type)` field is translated into the emitted native
single-file component so template bindings on that inject target resolve, and
when the inject is refused with no source.

## Requirements

### Requirement: A bounded inject field is translated into emitted state

The Angular component compiler MUST translate a field of the form
`name = inject(Type)` when `Type`'s class source is available to the conversion
and that class is inside the same closed state set as a component class. The
emitted native single-file component MUST declare state for every signal,
literal field and simple method the inject target provides that the template
uses. The compiler MUST refuse, with a finding and no generated source, an
inject it cannot resolve or whose target class it cannot fully translate.

#### Scenario: An inject target's signal is declared on the emitted screen

- **WHEN** a component declares `name = inject(Type)` and the template reads
  `name.member()` where `member` is a signal on `Type`
- **THEN** the emitted screen declares that member's state and the template
  binding no longer requires an unresolved identifier

#### Scenario: An inject target's method is declared on the emitted screen

- **WHEN** a component declares `name = inject(Type)` and the template calls
  `name.method()` where `method` is a simple method on `Type`
- **THEN** the emitted screen declares that method and reports no finding

#### Scenario: An unresolvable inject is refused

- **WHEN** a component declares `name = inject(Type)` and the conversion does
  not supply a readable source for `Type`, or `Type` uses a construct the class
  translator refuses
- **THEN** the compiler returns a finding and no generated source

### Requirement: The conversion path supplies the injectable source

The CLI Angular convert path MUST pass the injectable module source beside the
component script whenever the component script declares a bounded inject the
target is compiling. It MUST NOT invent an injectable source or fall back to a
hand-written screen when the source is missing.

#### Scenario: Convert reads the injectable beside the component

- **WHEN** `navirox convert` compiles an Angular component whose class declares
  `name = inject(Type)` imported from a readable module in the same project
- **THEN** the target receives both the component script and the injectable
  module source, and a fully supported inject emits generated screen source

#### Scenario: Convert refuses when the injectable source is missing

- **WHEN** the component declares an inject whose imported module cannot be
  read
- **THEN** the conversion reports the component as refused with a finding and
  writes no screen for it
