# Vue companion assembly

This is an assembly record. It shows how the field-workflow companion is built from
traceable origins, so a reviewer can tell generated output, moved shared units and
hand-written files apart. It is not a device result and it is not a claim about the
benchmarked project: the companion bundles and installs, and nothing here says its
screens match the web interface or that the underlying application was converted.

## What produced the companion

| Input | Value |
| --- | --- |
| Command | `node scripts/build-field-workflow-companion.mjs --keep` |
| Fixture | `packages/target-vue/fixtures/field-workflow/` |
| Source adapter | `vue` (7 files, 4 units, 0 findings) |
| Target compiler | `@memolabs-apps/target-vue` 0.1.1 |
| Generated screen hash | `3ae83ea130a3bdb80d17649cdf79f1bdf12a3881937e8870d8d3a9a525cf7e32` |
| Provenance record | `docs/evidence/vue-companion-assembly.provenance.json` |
| Application | `field-workflow-app`, scaffolded outside the checkout |

The command reads the fixture with the real source adapter and the real planner
before it builds anything, compiles the web fixture fresh, and refuses to continue
when the fresh compilation no longer matches the emitted screen file. Nothing about
the companion is decided by hand at assembly time.

## No subset extension was needed

The declared fixture compiles with zero findings, so this change extends no Vue
target construct. The compiler's supported subset is unchanged and the assembly
records that as an outcome rather than adding a construct no fixture needs.

## What the planner approved

The assembly consumes the planner's own classification instead of a copy list, so a
unit moves only when a decision approves it. The classification for this fixture:

| Subject | Classification | Reason |
| --- | --- | --- |
| `vue:fieldLogic.ts:utility:default` | `shared` | Logic with no platform capability use, so it moves without changing its behaviour. |
| `vue:fieldRecords.ts:utility:default` | `shared` | Same rule: the invented data moves as it is. |
| `vue:FieldWorkflowScreen.web.vue:component:default` | `native-replacement` | The view layer is rewritten; what carries over is the behaviour behind it. |
| `vue:FieldWorkflowScreen.native.vue:component:default` | `native-replacement` | Same rule, seen on the emitted file. |
| `vue:package.json:dependency:vue` | `portable` | A compatibility record says the framework renders on the native surface. It names no file, so the assembly treats the two shared units as the files to move. |

## Where every file came from

Each entry below is also in the machine-readable record
`docs/evidence/vue-companion-assembly.provenance.json`, which is the authoritative
copy. A file carries exactly one origin.

| File in the companion | Origin | Reason |
| --- | --- | --- |
| `packages/target-vue/fixtures/field-workflow/FieldWorkflowScreen.native.vue` | generated | The target compiler emitted this screen from the web fixture. |
| `fieldLogic.ts` | moved (`shared`) | The planner classified it shared, so its behaviour moves unchanged. Copied byte for byte from `packages/target-vue/fixtures/field-workflow/fieldLogic.ts`, sha256 `d04758454df68c3eff185da56b7cc8c36e0bc5b893973fd0a84ec2b02e7a182c`. |
| `fieldRecords.ts` | moved (`shared`) | The planner classified it shared, so its data moves unchanged. Copied byte for byte from `packages/target-vue/fixtures/field-workflow/fieldRecords.ts`, sha256 `064a841473a3ceed60e5b1e9a07e98043db718ec329466a39b15206a4bc242c9`. |
| `index.js` | manual | The scaffolder template writes the runtime bootstrap and mounts the app root. The assembly does not generate it. |

No file is missing an origin and no hand-written file is presented as generated. A
unit the planner classified `shared` is copied, never rewritten, and the assembly
fails if the copy is not byte-identical to its source. A test re-reads the record,
rechecks each moved hash against the file at its source path, and fails when a unit
is edited: appending one comment to `fieldLogic.ts` made that test fail and removing
it made the test pass again.

## The companion builds

Both platform bundles were produced from the freshly generated screen with the
moved units beside it, which is what proves the generated screen can resolve its
imports:

| Platform | Bundle | Declared identifiers found |
| --- | --- | --- |
| iOS | 6584 kB | 15 of 15 |
| Android | 6604 kB | 15 of 15 |

The bundles also carry the moved action wiring: the script asserts that `nextIn`
and `saveOutcome` appear in each bundle text, so the behaviour that moved is present
in the built application and not only the screen's markup.

## What this does not claim

Nothing here is a device result. The companion bundles; it has not been installed
and driven on a device by this change, and the next change runs the declared
acceptance scenario on iOS and Android and retains the captures. There is no visual
fidelity claim, no claim that any screen of the benchmarked application was
converted, and no claim about the benchmarked project's product direction or any
relationship with it.
