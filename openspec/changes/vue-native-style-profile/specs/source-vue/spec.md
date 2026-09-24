## ADDED Requirements

### Requirement: Vue style declarations become attributed facts

The Vue adapter MUST read static style blocks, class selectors, style bindings and scope metadata as attributed source facts, and MUST refuse a dynamic or unreadable style shape instead of guessing its rendered result.

#### Scenario: A static style block is attributed

- **WHEN** a view contains a readable static style block
- **THEN** the adapter reports its selectors, declarations, scope and source location

#### Scenario: A dynamic style binding is refused

- **WHEN** a style binding depends on runtime state or an unresolved expression
- **THEN** the adapter reports a source-located style finding and no complete style fact
