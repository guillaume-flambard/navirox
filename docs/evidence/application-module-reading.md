# Application modules, and the first file the engine actually moved

This records the change that made the graph contain a project's logic, and the
first migration that moved something.

## The gap this closed

The migration engine copies the units the plan classifies as `shared`, and its
first real runs moved nothing, because no adapter reported a plain module as a
unit. The adapters reported components and store declarations, so `shared` had no
producer and the largest body of code a migration can keep unchanged was absent
from the reading.

The five adapters now ask one neutral predicate. A test file, a configuration file,
an entry point and a declaration file are not application logic, and each exclusion
is a statement: a test is not shipped, configuration describes the build, an entry
point wires, a declaration file has no behaviour. The predicate lives in
`@navirox/source` because two copies of that question would eventually disagree
about the same file, and the disagreement would look like a framework difference.

## The plan on a real project, after

```
Navirox migration plan
  adapter  vue (Vue)

Decided
  shared                 1  moves unchanged
  portable               4  moves with its shape intact
  adaptable              6  keeps its behaviour, changes its platform call
  native-replacement     5  its role is understood, its implementation is rewritten
  web-fallback           0  kept as web for now, not the target
  manual                 0  a person has to decide
  unknown                1  Navirox has no answer yet
```

The shared unit is `src/lib/pinia.ts`, a module that creates the state container
and touches no platform capability. The adaptable ones are the four components plus
the modules that reach storage or the network, and the one unknown is the fixture's
`vue-router` dependency, which no record covers.

## The migration, dry run then performed

```
$ navirox migrate -C packages/source-vue/fixtures/vue-app --out /tmp/demo
Navirox migration
  dry run: nothing was written. Add --write to perform it.

Would move (1)
  src/lib/pinia.ts
      to src/lib/pinia.ts by copy-shared-unit

Not moved (8)
     5  no transform applies, and the plan called it native-replacement
     2  no transform applies, and the plan called it adaptable
     1  no transform applies, and the plan called it portable
```

```
$ navirox migrate -C packages/source-vue/fixtures/vue-app --out /tmp/demo --write
Navirox migration
  performed: the files below were written.
...
$ find /tmp/demo -type f
/tmp/demo/.navirox/migration.json
/tmp/demo/src/lib/pinia.ts
```

The second run reports the unit as `already migrated at this content` and moves
nothing, which is the fingerprint doing its job rather than a timestamp.

## What this proves

- The spine works end to end on a real project: inspect reads, the plan decides,
  the engine writes, and the record makes the second run a no-op.
- The dry run is the default and writes nothing.
- The file that moved is byte identical to its source, because the only transform
  that exists copies content.

## What it does not prove

- No framework code was rewritten and no native project was generated.
- The shared count on a real application is small, because a module that reaches a
  platform capability is `adaptable` rather than `shared`. That is the honest split,
  and it means a project whose logic all touches the browser moves little.
- The reading is per file: a module that imports another module which touches a
  capability is not itself marked as touching it. Stated as a limit rather than
  solved.
