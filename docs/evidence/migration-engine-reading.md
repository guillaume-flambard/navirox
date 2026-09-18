# The migration engine, run against real projects

This records what the engine does, and the gap the first real run exposed.

## The acceptance application, dry run

```
Navirox migration
  dry run: nothing was written. Add --write to perform it.

Would move (0)
  nothing

Not moved (5)
     4  no transform applies, and the plan called it native-replacement
     1  no transform applies, and the plan called it portable
```

The same run against the Vue adapter's own fixture produces the same shape: five
components and one store, nothing shared.

## The gap this exposed

The engine's first transform copies the units the plan classified as `shared`, and
`shared` is what the planner calls logic with no platform capability use. On a real
Vue project there are no such units, because **no adapter reports a plain module as
a unit**. The Vue adapter reports single file components and modules that declare a
store; every other `.ts` file is read for capability use and otherwise ignored.

So the plan's `shared` class has no producer in practice, and the engine copies
nothing on a real project. Both facts are true and neither is a bug in the engine:
the engine is a function of the graph, and it moves what the graph says is shared.
The change belongs in the adapters, which should report application modules as
units, and that is a separate decision with its own consequences for the unit
counts, the reports and the cross-adapter comparison.

It is recorded here rather than worked around, because an engine that appears to
work while moving nothing is the kind of thing that is discovered much later.

## What is proven, and how

- The engine's own suite proves the machine end to end: a shared unit is copied
  byte for byte, a second run at the same content is a no-op, a changed unit is
  work again, a view is left alone with a reason, an in place migration is refused,
  a path that escapes the output directory is refused, and a run that fails after
  writing puts every file back.
- The command's suite proves the join with the same fake adapter the other command
  tests use: a dry run writes nothing, a write run creates the file and the state
  record, and a second write run reports the unit as already migrated.

## What it does not claim

- No framework code was rewritten. The only transform that exists copies content.
- No native project was generated. The output directory is a destination.
- In place migration is refused by design, so nothing in this repository was
  migrated by this change.
