## MODIFIED Requirements

### Requirement: Differences are declared or fail

The comparison MUST report every declared mask and every declared tolerance, and
MUST fail on an undeclared layout, style or capture difference. When a scenario
declares a cross-platform tolerance, the comparison MUST return a verdict of
`pass` or `fail` against that declaration and MUST name every check it
evaluated. A pixel difference ratio MUST NOT be the value that decides a pass: a
run reports it as a measurement beside the verdict.

#### Scenario: An undeclared difference fails the scenario

- **WHEN** normalized measurement finds a difference outside declared tolerances
- **THEN** the report marks the scenario failed and names the difference

#### Scenario: A declared tolerance returns a verdict

- **WHEN** a scenario declares a cross-platform tolerance and a run compares its captures
- **THEN** the run reports `pass` or `fail` with the check that decided it, and reports the pixel ratio as a measurement beside that verdict

## ADDED Requirements

### Requirement: A scenario declares the cross-platform differences it accepts

A scenario MAY declare a cross-platform tolerance. A declared tolerance MUST
state the maximum relative difference between the two normalized grids and the
test identifiers the scenario requires on both platforms. A scenario that
declares no tolerance MUST keep the measurement-only behaviour. A declared
identifier MUST be checked where it exists, on the served web page and in the
running device application, and a missing identifier MUST fail the capture that
declared it.

#### Scenario: A missing identifier fails the capture

- **WHEN** a declared identifier is absent from the served web page or from the running device application
- **THEN** the capture fails and names the missing identifier instead of reaching the comparison

#### Scenario: A grid difference inside the tolerance passes

- **WHEN** both platforms produced every declared capture and their normalized grids differ by no more than the declared tolerance
- **THEN** the run reports a passing verdict and names the grid difference it accepted
