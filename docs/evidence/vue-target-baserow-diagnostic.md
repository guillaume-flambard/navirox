# Baserow target diagnostic

This is a diagnostic. No Baserow screen was generated, and this document makes no
claim of conversion, partnership or visual parity.

The machine readable record is
`docs/evidence/vue-target-baserow-diagnostic.json`, written by
`pnpm test:benchmarks -- --project baserow`.

## Source revision

| Field | Value |
| --- | --- |
| Repository | `https://github.com/baserow/baserow.git` |
| Commit | `81e094a1f4b3a62625c218d78fe319ba44098617` |
| Source directory | `web-frontend` |
| Adapter | `nuxt` |
| Target package | `@memolabs-apps/target-vue` 0.1.1 |
| Command | `node scripts/benchmark-projects.mjs --project baserow` |

The commit is pinned in `benchmarks/catalog.json`. The benchmark fetches it read
only and never installs or modifies the checkout.

## Attempted inputs

The analyze leg of the benchmark reports 46 routes and 41 screens for this
revision (2751 files, 1609 units, 259 capabilities).

The target diagnostic compiles a bounded sample of the analyzed screens with the
Vue target compiler and never passes an output path, so the compiler can return
source without any file being written. The catalog limit is 12 screens, so 12 of
the 41 analyzed screens were attempted.

## Attempted screens

| Screen | Findings |
| --- | --- |
| `modules/automation/pages/automationWorkflow.vue` | 1 |
| `modules/builder/pages/pageEditor.vue` | 1 |
| `modules/builder/pages/publicPage.vue` | 1 |
| `modules/core/components/RouterViewPlaceholder.vue` | 0 |
| `modules/core/pages/_health.vue` | 0 |
| `modules/core/pages/admin/aiProviders.vue` | 10 |
| `modules/core/pages/admin/dashboard.vue` | 19 |
| `modules/core/pages/admin/health.vue` | 6 |
| `modules/core/pages/admin/settings.vue` | 14 |
| `modules/core/pages/admin/users.vue` | 1 |
| `modules/core/pages/admin/workspaces.vue` | 1 |
| `modules/core/pages/changeEmail.vue` | 7 |

## Blocker codes and counts

61 findings over 12 screens:

| Blocker code | Count |
| --- | --- |
| `unsupported-element` | 41 |
| `unsupported-directive` | 20 |
| `template-parse-failed` | 0 |
| `unsupported-style` | 0 |

The most frequent blockers are `v-skeleton` (18 occurrences), the `<SwitchInput>`
component (7), `<Button>` (5), `<nuxt-link>` (4), `<i>` (3), `<template>` (2) and
`v-show` (2). The remaining 20 occurrences are single findings for
`<AutomationWorkflowContent>`, `<PageEditorContent>`, `<PublicPageContent>`,
`<AIProviderFeatureSettings>`, `<AIProviderAdminSkeleton>`, `<AIProviderItem>`,
`<AIProviderFormModal>`, `<AIProviderModelFormModal>`, `<AIProviderConfirmModal>`,
`<ActiveUsers>`, `<EmailTester>`, `<SkeletonBlock>`, `<RadioGroup>`, `<FormGroup>`,
`<component>`, `<UsersAdminTable>`, `<WorkspacesAdminTable>`, `<LangPicker>`,
`<Error>` and `<ButtonIcon>`.

An earlier run of this diagnostic selected the analyzed route sources instead of
the analyzed screens. For a Nuxt project those route sources are JavaScript route
modules, not single file components, so that run produced five parse failures and
said nothing about the templates. The selection now uses the analyzed screens.

## Screens inside the supported subset

Two of the 12 attempted screens compiled with no finding:
`modules/core/components/RouterViewPlaceholder.vue` and
`modules/core/pages/_health.vue`. The compiler returned source for them and no
file was written, because the diagnostic passes no output path. Those two screens
are the only ones in the sample that the current supported subset covers end to
end, and they are not evidence that a full Baserow screen is reachable.

## What this document does not say

It does not say that Baserow was migrated, converted, or worked on with its
maintainers, and it makes no visual parity claim for any Baserow screen. The
counts cover 12 of the 41 analyzed screens, and every count is a blocker count for
the current supported subset of the Vue target, not a statement about what a
future version could support.
