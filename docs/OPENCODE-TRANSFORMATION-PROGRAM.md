# Programme d'implémentation OpenCode

Ce document est le backlog exécutable de
[`PRODUCT-COMPLETION-SPECS.md`](PRODUCT-COMPLETION-SPECS.md). Chaque identifiant
est un futur changement OpenSpec. Un identifiant ne devient une tâche de code
qu'après création de `proposal.md`, `design.md`, `tasks.md` et des deltas de
specs nécessaires, puis `openspec validate <id> --strict`.

Le livrable final est le golden path :

```bash
navirox transform <repository> --app <application> --profile <profile> --out <mobile-workspace>
```

Il produit un projet mobile généré, runnable, régénérable et traçable. `inspect`,
`plan` et `compat` sont des préflights du même parcours, jamais la condition de
sortie d'une tranche.

## Règles pour l'orchestrateur

1. Lire `AGENTS.md`, `docs/EXECUTION-CHARTER.md`,
   `docs/PRODUCT-COMPLETION-SPECS.md`, cette page et les OpenSpecs actifs avant
   de déléguer.
2. Utiliser un worktree propre par agent. Ne pas demander à deux agents de
   modifier le même package, spec ou fixture; fusionner une tranche avant la
   suivante.
3. Créer un changement OpenSpec par identifiant et ne cocher aucune tâche sans
   commande ou artefact de preuve réellement produit.
4. Les frameworks restent dans leurs source adapters. Les source adapters ne
   connaissent jamais un target; les targets ne connaissent jamais un framework;
   seuls `runtime-symbiote` et les applications accèdent au renderer selon les
   règles d'`AGENTS.md`.
5. Tout construct non couvert doit être `refused` ou `manual-required`, sans
   sortie qui puisse être présentée comme fidèle.
6. Aucun agent ne publie de package, ne crée de release, n'utilise credentials,
   ne se connecte à un service réel ni ne réutilise marque/données externes sans
   autorisation séparée.
7. À la fin de chaque changement : tests ciblés, `corepack pnpm build`,
   `corepack pnpm test`, `corepack pnpm lint`, `corepack pnpm format:check`,
   validation OpenSpec stricte, puis diff review. Si une commande est impossible,
   enregistrer l'indisponibilité et ne pas déclarer le changement terminé.

## Tranche 0 : vérité et dette active

Ces lots ne dépendent pas du nouveau programme. Ils assainissent l'état avant
d'ajouter les fondations.

| ID                                 | Dépendances     | Portée exclusive              | Sortie                                                                                                      | Agents                    |
| ---------------------------------- | --------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------- |
| `close-complete-openspec-changes`  | aucune          | `openspec/changes` complets   | Les cinq changements complets sont validés puis archivés; aucun code modifié.                               | 1                         |
| `angular-target-component-state`   | clôture         | `target-angular`, CLI convert | `compileAngularComponent` traduit état/méthodes bornés ou refuse, sans code partiel.                        | 1                         |
| `angular-target-device-proof`      | component-state | fixture/harness Angular       | Le composant généré est réellement construit et actionné iOS/Android, ou la tâche reste ouverte avec cause. | 1                         |
| `optional-llm-assistance-contract` | clôture         | planner/CLI semantic specs    | Tests et spec garantissent l'opt-in et l'absence de décision/source upload.                                 | 1, parallèle avec Angular |

## Tranche 1 : discovery et gouvernance de versions

### `repository-capability-manifest`

**Dépendances :** tranche 0. **Packages :** nouveau package neutre ou
`@memolabs-apps/inspect` après design. **But :** produire un manifest déterministe
avant toute transformation.

**TODO :**

- Définir le schéma versionné, hash de snapshot, application sélectionnée,
  racines/workspaces/packages, package manager, lockfiles, versions résolues,
  framework candidates, configs, plugins, build entries, conventions et escape
  hatches.
- Implémenter discovery pnpm/npm/Yarn/Bun, workspace, Nx/Turbo et mono-package
  sur une liste de fichiers et lecteurs injectés, sans shell opaque.
- Reporter confiance, evidence et source location de chaque fait; rendre les
  collisions de framework et applications multiples explicites.
- Classer `eligible`, `eligible-with-deltas`, `manual-discovery-required` et
  `refused`; aucun résultat autre que `eligible` ne peut lancer l'émission.

**Tests/acceptation :** fixtures mono-package, pnpm workspace, Nx/Turbo,
configuration inconnue et collision framework; mêmes inputs, même manifest et
hash; un fichier non couvert donne un refus localisé.

### `adapter-version-governance`

**Dépendances :** capability-manifest. **Packages :** source, inspect, adapter
fixtures et compat. **But :** lier tout profil transformable à des versions et
preuves réelles.

**TODO :**

- Définir matrice `framework/version/topology/plugin/profile/gate/evidence`.
- Ajouter corpus positif, limite et refusé avec lockfile et config pour Vue,
  Angular, React et Svelte.
- Créer contract suite discovery -> graph -> diagnostic avec version hors range.
- Ajouter protocole de requalification à chaque upgrade d'upstream et fixture de
  major non vérifiée, initialement Vue 4.
- Retourner `outside-verified-range` avec alternative et sans génération.

**Tests/acceptation :** aucune plage de package ne suffit à déclarer un support;
une major inconnue est refusée déterministiquement; chaque ligne de matrice a
une fixture et une commande.

## Tranche 2 : contrat de transformation neutre

### `workflow-ir-contract`

**Dépendances :** tranche 1. **Packages :** nouveau `@memolabs-apps/workflow` ou
équivalent neutre. **But :** créer l'interface entre lowering de source et
génération native, sans AST universel.

**TODO :**

- Définir `Workflow`, `Screen`, `ViewNode`, `Binding`, `Action`, `StateModel`,
  `LayoutConstraint`, `StyleToken`, `Resource`, `Coverage` et erreurs.
- Versionner sérialisation, hashing, provenance source, migration de schéma et
  compatibilité arrière.
- Exiger pour chaque node une couverture générée, manuelle, exclue ou refusée.
- Ajouter fixtures de sérialisation stable et refus d'un workflow incomplet.

**Acceptation :** aucun nom de framework ni API renderer dans les types publics;
un node source sans coverage bloque le target.

### `source-transform-provider-seam`

**Dépendances :** workflow-ir-contract. **Packages :** source et source adapters.
**But :** définir `lower()` comme extension source qui produit l'IR.

**TODO :**

- Définir `SourceTransformProvider.lower(selection, snapshot, profile)` et le
  contrat de diagnostic/coverage.
- Définir `TargetProvider.emit(workflow, targetProfile)` indépendamment.
- Renforcer les tests statiques : aucun adapter source n'importe target/runtime,
  aucun target n'importe framework.
- Construire fake lowerer + fake target et deux adapters de test contrastés.

**Acceptation :** les tests de seams échouent si un import interdit apparaît;
deux lowerers consomment la même interface sans champ spécifique à Vue.

### `transform-orchestrator-contract`

**Dépendances :** les deux changements précédents. **Packages :** CLI et
orchestrateur neutre. **But :** définir le module profond et l'interface de
`navirox transform`, sans encore promettre la couverture Vue complète.

**TODO :**

- Spécifier `transform({ root, app, profile, output }) -> TransformResult`.
- Orchestrer discovery, eligibility, inspect/plan, lower, emit, migration,
  provenance et scaffold avec arrêt avant écriture en cas de refus.
- Introduire outputs `generated/`, `shared/`, `manual/`,
  `navirox.manifest.json`, tests et rapport de deltas.
- Refuser path traversal, output dans la source, écriture partielle et profil
  ambigu; rendre le dry-run par défaut.

**Acceptation :** fake source/fake target parcourent le CLI sans FS unsafe et
produisent un manifest complet; un refus laisse l'output intact.

## Tranche 3 : workflow Vue de référence

### `vue-workflow-lowering-core`

**Dépendances :** tranche 2. **Packages :** `source-vue` uniquement et fixtures.
**TODO :** abaisser `<script setup>`, props/emits, refs, reactive, computed,
interpolation, bindings, `v-if`, `v-for`, événements et `v-model` du profil;
refuser render functions, composants dynamiques, watchers et code ambigu.

**Acceptation :** fixture positive/limite/refusée; IR stable, coverage exhaustive,
source locations et refus sans node partiellement émis.

### `vue-router-workflow-lowering`

**Dépendances :** vue-lowering-core. **Packages :** source-vue/router fixtures.
**TODO :** routes littérales, params, navigation et deep links dans l'IR; routes
calculées, guards et plugins non couverts refusés.

### `vue-state-portability`

**Dépendances :** vue-lowering-core et transform orchestrator. **Packages :**
planner/migrate/source-vue. **TODO :** migrer seulement stores/composables purs
approuvés; vérifier imports et comportement; produire un TODO manifeste pour le
reste.

### `vue-native-target-emission`

**Dépendances :** workflow IR + Vue lowering. **Packages :** nouveau target
neutre ou évolution de target-vue vers consommation IR. **TODO :** émettre
primitives, bindings, actions, variants, a11y, test IDs et provenance depuis
l'IR, pas depuis le SFC direct; refuser toute coverage non générée.

### `vue-native-style-profile`

**Dépendances :** native target emission. **TODO :** tokens/layout flex,
dimensions, spacing, couleur, typo, images et variants; refuser cascade,
pseudo-classes, media queries et CSS dynamique hors profil.

### `vue-generated-workflow-proof`

**Dépendances :** les cinq changements Vue. **Packages :** fixture, visual
benchmark, native harness. **TODO :** générer un workflow avec états empty,
loading,error,success, interactions et motion; exécuter mêmes actions web/iOS/
Android; mesurer structure, a11y et tolérances visuelles.

**Acceptation de tranche :** le golden path Vue crée un workspace sans view
manuelle, build propre, T3 comportemental et T4 visuel pour le profil exact.

## Tranche 4 : Nuxt et workspace durable

### `nuxt-workflow-lowering`

**Dépendances :** Vue T3. **TODO :** pages/layouts, `definePageMeta`, routes
filesystem, params, composables client et assets; SSR, middleware, server routes
et données réelles refusés jusqu'à profils dédiés. **Acceptation :** Nuxt T3 sur
fixture avec deep link, loading, vide et erreur.

### `generated-workspace-ownership`

**Dépendances :** transform orchestrator + Vue T3. **TODO :** ownership
`generated/shared/manual`, manifest de fichiers, régénération, détection des
edits generated, choix explicite patch/extension/régénération.

### `workflow-migration-transaction`

**Dépendances :** generated-workspace-ownership. **TODO :** dry-run, diff,
apply, rollback, source/plan comparison et idempotence au niveau workflow.

### `generated-workspace-external-install`

**Dépendances :** workspace ownership. **TODO :** test hors monorepo depuis
tarball ou publication réellement disponible; build et test du workspace généré.

## Tranche 5 : qualité Vue/Nuxt et livraison V1

| ID                                       | Dépendances                      | TODO principal                                                                  | Sortie                                   |
| ---------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------- |
| `framework-capability-corpus`            | Vue/Nuxt T3                      | Corpus positif/limite/refusé, hashes, devices, fonts et preuves par capability. | Toute capability a fixture + evidence.   |
| `transform-regression-governance`        | corpus                           | Invalidation/requalification après changement source/target/runtime/device.     | Diff de preuve, pas de drift silencieux. |
| `external-vue-nuxt-transformation-proof` | corpus                           | Deux repos externes, données/assets originaux, profils bornés.                  | T3/T4 externe sans claim large.          |
| `mobile-release-candidate`               | Vue T5/Nuxt T3                   | Build iOS/Android, SBOM, licences, provenance, rollback, checklists.            | T5 et candidate reproductible.           |
| `public-transform-install`               | release candidate + autorisation | Publication complète ou limite tarball renforcée.                               | Installation externe honnête.            |

## Tranche 6 : autres frameworks

Chaque famille suit la même mini-séquence : `version-profile`, `lowering`,
`target-fixture`, `generated-device-proof`, `visual-profile`, puis
`external-requalification`. Un framework ne passe pas à la famille suivante
avant son T3; T6 exige corpus et support durable.

| Ordre | Série de changements                                                                                                                  | Contraintes propres                                                                                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1     | `svelte-profile`, `svelte-lowering`, `svelte-generated-proof`; `sveltekit-profile`, `sveltekit-lowering`, `sveltekit-generated-proof` | Blocks, bindings, stores, routes/layouts client; slots/actions/transitions/SSR exclus avant profil.                  |
| 2     | `angular-profile`, `angular-lowering`, `angular-generated-proof`                                                                      | Components standalone, signals, formulaires bornés; DI runtime, lifecycle, RxJS arbitraire et Material refusés.      |
| 3     | `react-profile`, `react-lowering`, `react-generated-proof`; `next-pages-profile`, `next-app-profile`, `next-generated-proof`          | JSX/hooks purs; classes/refs/effets arbitraires refusés. App/Pages Router séparés, server code exclu.                |
| 4     | `astro-island-orchestration`, `astro-generated-proof`                                                                                 | Un îlot délègue seulement à une famille déjà T3; pas de backdoor.                                                    |
| 5     | `solid-profile`, `qwik-profile`, `lit-profile`, `vanilla-profile`, puis leur `*-lowering` et `*-generated-proof`                      | Réactivité/sérialisation, custom elements/slots, DOM/JS dynamique explicitement profilés et refusés hors couverture. |

## Tranche 7 : support durable

| ID                               | Dépendances                   | TODO                                                                                                     |
| -------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `transform-performance-budgets`  | deux familles T3              | Budgets bundle, startup, mémoire, interactions par profile/device.                                       |
| `transform-reproduction-support` | release candidate             | Archive de manifest, commandes, artefacts, source minimisée et politique de redaction.                   |
| `framework-support-policy`       | corpus/version governance     | Versions, dépréciations, SLAs éventuels, requalification et exits de support.                            |
| `enterprise-execution-model`     | demande client + threat model | Local/private agent ou cloud, isolation, retention, audit, suppression. Ne pas ouvrir sans autorisation. |

## Prompt maître à coller dans OpenCode

```text
Tu es l'orchestrateur principal d'un programme long de Navirox. Ton résultat
final n'est pas un rapport d'audit : un développeur doit pouvoir lancer
`navirox transform <repo> --app <app> --profile <profile> --out <workspace>` et
recevoir un projet mobile natif généré, runnable, régénérable et traçable.

Lis entièrement AGENTS.md, docs/EXECUTION-CHARTER.md,
docs/PRODUCT-COMPLETION-SPECS.md et docs/OPENCODE-TRANSFORMATION-PROGRAM.md.
Respecte le premier document en cas de conflit.

Travaille en tranches dépendantes, jamais comme une masse de changements :
1. Exécute Tranche 0, fusionne et vérifie son baseline.
2. Crée les changements OpenSpec de Tranche 1. Tu peux déléguer discovery et
   version governance à deux agents dans deux worktrees, car leurs packages et
   specs sont distincts. Fais relire et fusionne avant Tranche 2.
3. Tranche 2 est séquentielle: Workflow IR, puis seam de lowering, puis
   orchestrateur transform. Utilise un agent d'architecture et un agent de tests
   en revue, mais un seul agent auteur par seam.
4. Tranches 3 à 5 construisent et prouvent le golden path Vue/Nuxt. Aucun travail
   de framework suivant ne commence avant Vue T3. N'annonce pas de fidélité avant
   les captures et tolérances T4.
5. Tranche 6 traite une famille à la fois: Svelte/SvelteKit, Angular,
   React/Next, Astro, puis Solid/Qwik/Lit/Vanilla. Chaque famille doit atteindre
   T3 avec son propre corpus avant la suivante.
6. Tranche 7 n'ouvre cloud, connecteurs, SSO ou SLA que si une demande, une
   autorisation et un threat model existent.

Pour chaque identifiant du programme :
- crée/complète proposal.md, design.md, tasks.md et les deltas OpenSpec;
- assigne un worktree isolé et un périmètre de fichiers exclusif;
- écris fixture positive, limite et refusée avant ou avec le code;
- ajoute tests de déterminisme, provenance, seams, comportement et, si visible,
  accessibilité/capture;
- n'émet aucun code pour un construct non couvert; retourne un diagnostic et une
  coverage explicite;
- exécute les commandes ciblées puis `corepack pnpm build`, `corepack pnpm test`,
  `corepack pnpm lint`, `corepack pnpm format:check` et
  `corepack pnpm exec openspec validate <change> --strict`;
- ne marque une tâche complète que si les artefacts existent et sont cités.

Règles non négociables : aucun import de framework hors source adapter; aucun
import de target dans un source adapter; aucun import de framework dans le core;
runtime-symbiote reste l'unique accès au renderer; pas de WebView déguisée; pas
de credential, réseau réel, publication, store ou donnée/marque externe sans
autorisation explicite. Préserve les changements utilisateur non liés.

Après chaque tranche, produis : les changements fusionnés, les commandes et
résultats, les artefacts de preuve, les limitations/refus restants, et la tranche
suivante qui est réellement déverrouillée. Si une preuve device ou externe est
indisponible, conserve la tâche ouverte et explique la cause: ne simule jamais
un succès.
```

## Prompt d'un sous-agent implémenteur

```text
Tu implémentes uniquement le changement OpenSpec <ID> dans ton worktree Navirox.
Lis AGENTS.md, le changement OpenSpec, les specs stables concernées et
docs/OPENCODE-TRANSFORMATION-PROGRAM.md. Ne modifie aucun fichier hors de ton
périmètre sans ouvrir une décision de seam.

Commence par écrire ou compléter les tests et fixtures qui définissent le profil
couvert. Implémente le minimum qui les fait passer. Un construct inconnu doit
produire coverage + finding et aucune sortie fidèle prétendue. Préserve source /
target / runtime seams et les changements utilisateur. Exécute les validations
ciblées, le baseline, la validation OpenSpec stricte et `git diff --check`.
Dans ton rapport, donne : fichiers modifiés, interface ajoutée, preuves exactes,
constructs refusés, limites et suites bloquées. Ne publie rien et n'utilise aucun
secret ou service externe.
```
