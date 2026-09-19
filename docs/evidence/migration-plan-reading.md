# The migration plan, run against the acceptance app

This records the first plan Navirox produced, and what it does and does not claim.

## Commission

```
node packages/cli/dist/bin.js plan -C examples/vue-basic
```

## The plan, verbatim

```
Navirox migration plan
  adapter  vue (Vue)

Decided
  shared                 0  moves unchanged
  portable               1  moves with its shape intact
  adaptable              0  keeps its behaviour, changes its platform call
  native-replacement     4  its role is understood, its implementation is rewritten
  web-fallback           0  kept as web for now, not the target
  manual                 0  a person has to decide
  unknown               14  Navirox has no answer yet

Not decided (14)
    14  Whether this dependency works on a native surface needs a compatibility
        record, which does not exist yet.
        for example vue:package.json:dependency:@memolabs-apps/metro-preset
```

## How to read it

- The one `portable` decision is the Pinia store. State lives behind the runtime
  seam, so a store moves with its shape intact, which the repository has already
  proven on a device.
- The four `native-replacement` decisions are the four single file components.
  That is the blueprint's own statement that the view layer is rewritten, and it
  is nearly information free on purpose: the alternative would be to imply that
  markup moves as it is.
- The fourteen `unknown` decisions are every production dependency, and each one
  says why: whether a dependency works on a native surface needs a compatibility
  record, and none exists yet. The reading is honest rather than silent, which is
  the difference between a gap in the graph and a gap in the facts.

## What it does not claim

- No target. The plan says what a part is, not what it becomes, because no target
  provider exists and naming one would have smuggled a build strategy into a
  statement about source code.
- No transforms. This change decides; it does not move code.
- Nothing about capability use, because this application reaches native storage
  through `@memolabs-apps/native` rather than through `localStorage`, so the reading
  found no browser capability to classify. The rules for those exist and are
  covered by the planner's own tests over hand built graphs.

## The defect the command line found

The first version rendered the unknown list subject by subject, so fourteen
dependencies printed fourteen identical sentences and the count that mattered was
the hardest thing on the screen. The renderer now groups by reason and prints one
line per reason with an example, which is a statement about rendering only: the
plan itself was already correct.
