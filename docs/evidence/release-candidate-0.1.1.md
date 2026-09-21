# Release candidate 0.1.1 — evidence

Candidate commit: the commit tagged `candidates/0.1.1`
(`git rev-parse candidates/0.1.1` resolves it; the tag is created in task
6.1 and never moved afterwards).

All observations below were made from packed tarballs, not from a checkout:
31 archives packed with `pnpm pack` semantics from the candidate tree,
installed into a scaffolded app outside the monorepo, driven there.

## Pack (task 4.1)

- `pnpm build` green, 31/31 workspaces.
- `node scripts/e2e-scaffold.mjs --bundle --keep` passed end to end:
  31/31 archives pack, every one at 0.1.1.
- The scaffolded app installs with exactly one copy of the runtime
  (`assertSingleRuntime`), lint passes on the generated tree, and
  `navirox --help` answers.

SHA-256 of the 31 packed archives (the binding between this report and the
artifacts it describes):

```text
17e73d8383c9579e955c99666ad533dc202460ae9c664f2f41fe0c379271478c  create-navirox-0.1.1.tgz
5020f7a3e00508ba2d9d62a78fba7c8c856073790060611255db696040bf42de  memolabs-apps-build-0.1.1.tgz
fe4bd3eafaf89e124a684f12bb5bbb67f0dda3e8e14cb518c0c1e2b6bddf47a  memolabs-apps-cli-0.1.1.tgz
f192bbb70a3a74ca6ab9d5b39f2168cdb67ace6569f598d378029fd55ede0087  memolabs-apps-compat-0.1.1.tgz
fb7e307a639a21d50a06dc0d99a535ce9ad4dc629268301e5a4beb3182f592ea  memolabs-apps-config-0.1.1.tgz
493d84786e070d1fc9280dd37b468731f4754cf37695a6089287bb2eda4a37b5  memolabs-apps-doctor-0.1.1.tgz
b5578a8bb34c8f482210bfec5a80b78fc75ae9eee90e9b5d5d2897377a2eae35  memolabs-apps-graph-0.1.1.tgz
25b00275f6db713243ebc7356070f85fbc2712dfc33314884f739b5b13a1aed8  memolabs-apps-inspect-0.1.1.tgz
125d95ea171293798d78b52d29b5054dc5c566003384b5ce125ed90f116583f9  memolabs-apps-metro-preset-0.1.1.tgz
0360b8424d6850938602889178185d478abe650d6388704e952a75dd6236aa50  memolabs-apps-migrate-0.1.1.tgz
61ed0fc8cc6fae618b077b7e699140bfb5dfcb755afa2c1cf2ea91bb05fdf67e  memolabs-apps-native-0.1.1.tgz
ea159ddc1d17f6cfcd4fe762c3331e3da31136a8d6ae372703b30ac3a0e1b130  memolabs-apps-planner-0.1.1.tgz
ca990796a41aff8725b7d0c8c874b6b99466b9a725e9999f27629333a8efb006  memolabs-apps-router-0.1.1.tgz
fb10908998b4e851718ff0a30014e8e2df15ca177cae0f529f7acb3946478c32  memolabs-apps-runtime-0.1.1.tgz
bfa9b28fdd0037636251aec31bbef9da9fb245b70554f11c64ed2d665d929384  memolabs-apps-runtime-symbiote-0.1.1.tgz
e9812b5bc665057c0da5b52b4eca3dbdf2d40f9c42685017122a5240e73e032f  memolabs-apps-source-0.1.1.tgz
dec1a338f3b648943ffd432688f458cefb2a91ff46d7fccc55b1ce9774d47d56  memolabs-apps-source-angular-0.1.1.tgz
0f6033ee2063f6056c49c112c819ff3218e5075631bf6ef915bca1343a08e503  memolabs-apps-source-astro-0.1.1.tgz
3ccb2f97c705e09aaf49c6b75d7f834d9f85a5705166685a12e8b963cd8a8f0e  memolabs-apps-source-lit-0.1.1.tgz
837a5f46f169f161f3e98756fee80d9abf0f5446b826270665200010446db9cc  memolabs-apps-source-next-0.1.1.tgz
100adcfd9bc03acbecd82b7b454533ebf453a72dfad90d9bbc8ff44c900c95fd  memolabs-apps-source-nuxt-0.1.1.tgz
6c83ef14897f367f713a946dc694dca5011d89dc346b005314a9f434f7d0a617  memolabs-apps-source-qwik-0.1.1.tgz
b02380794e7aa839c4b8408c6eb95be32766398755c7c0af06142fa1eecafc76  memolabs-apps-source-react-0.1.1.tgz
cc9432871419fad9f7494af41ced2bfd643f2a9535d8f3fec0f2ea147d9b37dc  memolabs-apps-source-solid-0.1.1.tgz
152f6c29c004a1008dd19073fc69d1b88e3c0d0b945b60b0dccf1485052a19d2  memolabs-apps-source-svelte-0.1.1.tgz
d626e926cc1a48e0652736e4a728be7cdf4e9cd07a4b577ff89add9be14d9ecd  memolabs-apps-source-sveltekit-0.1.1.tgz
431580519058854fd308aa8d70c7ff35f11ddcb30f398402fbc7d694079017fb  memolabs-apps-source-vanilla-0.1.1.tgz
6a259f9c33fdddd2d1c8db30a514b3fc8a7cc2a428b042b8eacd29650980fb0d  memolabs-apps-source-vue-0.1.1.tgz
8a6e59cd3e620e854358c33ab1377eec3de715637d90875c8d743ff30f25f987  memolabs-apps-target-vue-0.1.1.tgz
7a5a227d970dd1c8a859a5ee0b15ebacc507e17626cd53515ff73a50c9d44938  memolabs-apps-ui-0.1.1.tgz
be4322482ffad846307bb458a8c4265fdc861010aa30ab7eb460fb45ff275f27  navirox-0.1.1.tgz
```

## Outside-repo exercise (task 4.2)

Conditions: kept `--keep` workspace from the run above, app installed from
the local `artifacts/` directory, no checkout visible. A copy of the
`source-vue` fixture was driven through the installed `navirox` binary:

| Capability | Observation |
| ---------- | ----------- |
| `doctor` | exit 0, iOS and Android |
| `inspect --json` | exit 0, report names framework, routes, components |
| `plan --json` | exit 0, migration plan emitted |
| `migrate --write --json` | exit 0, `migration.json` persisted on disk |
| Metro iOS bundle | 6 613 929 bytes |
| Metro Android bundle | 6 634 460 bytes |

During the pack run itself, `analyze`/`plan`/`migrate` were additionally
exercised for the Vue, Angular, Nuxt, Next, and React fixtures.

## Transcripts

- Clean install: `release-candidate-0.1.1-install.txt` — `pnpm install
  --force` in the tarball-installed app, exit 0, 720 packages.
- Command transcripts: `release-candidate-0.1.1-commands.txt` — the full
  `doctor`, `inspect --json`, `plan --json`, and `migrate --write --json`
  outputs from the table above, each exit 0.

## CI journey (native evidence)

The candidate's own CI run attaches to the candidate commit after the push
in task 6.2; look for the `CI` workflow run on that commit. The closest
pre-existing evidence is run 35511495132 on `main` (base `ef5418b`,
2026-09-20), whose result must be read honestly:

| Job | Result |
| --- | ------ |
| scaffold, install and build for Android | success |
| scaffold, install and build for iOS | success |
| install / build / typecheck / test | success |
| vue-basic journey on a simulator | failure |
| vue-basic journey on an emulator | failure |
| vue-pilot journey on a simulator | failure |
| vue-pilot journey on an emulator | failure |

All four journey jobs fail the same way: `detox build` crashes with
`MODULE_NOT_FOUND` for `stream-json` under detox's nested pnpm path on the
runner, before any app code runs. That is a runner dependency install
issue (the base commit itself is a stream-json advisory patch), not a
candidate regression — but it means the device-journey evidence for this
candidate is red until the runner install is fixed, and the candidate's
own CI run must be checked with that in mind.

## Known gaps

- The `0.1.0` tags predate the scoped rename (bare `0.1.0` and
  `create-navirox@0.1.0` point at the pre-rename commit; the 29 scoped
  `@0.1.0` tags point at the rename commit, five commits behind the design
  baseline). Untouched on purpose; `candidates/0.1.1` is the only tag this
  change creates.
- The public registry still holds 26 of the 29 scoped packages at `0.1.0`
  (`cli`, `source-lit`, `source-solid` 404). Publication is issue #17, with
  the `npm view` verification described in `docs/RELEASE-0.1.1.md`.
- Until publication, `npx navirox` against the public registry still fails;
  the tarball path above is the working install story.
