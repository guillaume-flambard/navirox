# The portable migration slice, proven on the pilot

Evidence for issue #13. The change record is
`openspec/changes/migration-portable-units/`.

## What changed

The plan classifies a state module `portable`, because the runtime seam gives a
store a home. Before this change the only transform copied units the plan called
`shared`, and the pilot had none, so `navirox migrate` produced nothing. The
transform is now `copy-movable-unit` and it copies the units the plan called
`shared` or `portable`, byte for byte, and the run reports the imports the copied
file names that the run did not carry.

## The command that was run

From the repository root, against the pilot (`pilots/vue-web`, outside the pnpm
workspace), with the CLI built:

```
node packages/cli/dist/bin.js migrate -C pilots/vue-web --out <temp>
```

## What it reported

```
Navirox migration
  dry run: nothing was written. Add --write to perform it.

Would move (1)
  src/stores/catalogue.ts
      to src/stores/catalogue.ts by copy-movable-unit

Unresolved imports (2)
  src/stores/catalogue.ts
      ../api/products: the file it names was not moved by this run
  src/stores/catalogue.ts
      ../lib/favourites: the file it names was not moved by this run

Not moved (6)
     4  no transform applies, and the plan called it native-replacement
     2  no transform applies, and the plan called it adaptable
```

The write run wrote exactly two files into the output directory,
`src/stores/catalogue.ts` and `.navirox/migration.json`, and a second write run at
the same source content reported `Would move (0)` and `already migrated at this
content`. A dry run left the output directory empty.

## What was automated, and what stayed manual

Automated:

- The Pinia store `src/stores/catalogue.ts` is copied byte for byte into the
  output directory, with a state record that makes the second run a no-op.

Manual, and now named by the run rather than hidden:

- `src/api/products.ts` and `src/lib/favourites.ts` are `adaptable`, so the copy
  did not move them, and the store's two imports of them are reported as
  unresolved. The report reason is `the file it names was not moved by this run`,
  which means both files exist in the source and each needs the adaptable work
  the plan describes.
- The four views are `native-replacement`: they are the view layer the blueprint
  says is rewritten, and the report says so per unit.
- Nothing was rewritten. The copy moves the store with the shape it already has,
  and the store imports only `pinia` and `vue`, which the canary app proves are
  renderer free and legal on native.

## What this does not prove

- It does not prove the migrated store runs inside a native application. That is
  the next issue, and it needs the adaptable modules resolved first.
- It does not resolve an aliased import. The pilot's store uses relative imports;
  an alias such as `@/api/products` would be reported as unresolved rather than
  resolved by guesswork.
- It does not add a unit to unit import edge to the App Graph. The report reads
  the moved file's imports, which is enough to name the manual work, and the
  graph stays as it is.
