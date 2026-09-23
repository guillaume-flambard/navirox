# Programme de transformation fidèle et de finition produit

## Statut et décision de cadrage

Cette feuille de route remplace la définition précédente, trop étroite, de
« produit fini ». Elle ne déclare aucun support nouveau. Pour le travail actif,
`docs/EXECUTION-CHARTER.md`, `docs/PROOF-ROADMAP.md` et
`docs/OPENSPEC-BACKLOG.md` restent prioritaires. Chaque lot ci-dessous doit être
ouvert dans une proposition OpenSpec avant implementation.

Le contrat produit principal est simple : un développeur indique un repository
web pris en charge à Navirox et reçoit un **projet mobile natif généré, fidèle,
runnable et traçable**. Analyse, compatibilité et diagnostic sont les étapes
internes qui protègent cette conversion. Ils servent à refuser un profil non
couvert, expliquer une limitation et préparer le générateur; ils ne sont ni le
livrable final ni le headline du produit.

La fidélité ne veut pas dire copier une application entière à 100 %: la view
layer est réécrite pour le mobile. Elle signifie qu'un workflow et un profil de
source déclarés préservent structure, comportement, états, intention visuelle et
contraintes opérationnelles, ou que Navirox refuse explicitement la génération.

## Vérité technique au 23 septembre 2026

| Surface        | Prouvé                                                                                                                                       | Non prouvé                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Source         | Vue, Nuxt, Svelte, SvelteKit, Angular, React, Next, Astro, Solid, Qwik, Lit et Vanilla détectent, inspectent et alimentent le graphe neutre. | Qu'un workflow de chacun est abaissé, généré et exécuté nativement.                                           |
| Graphe/plan    | Les faits de source, décisions et inconnues sont déterministes.                                                                              | Une sémantique suffisante pour générer une view ou un comportement fidèle.                                    |
| Migration      | `migrate` copie les unités `shared`/`portable` et ajoute éventuellement une extension d'import.                                              | Transforms de framework, état, routes, dépendances, formulaires, assets ou tests.                             |
| Target Vue     | Un sous-ensemble de template et de CSS simple émet un SFC avec provenance.                                                                   | Scripts, stores, routing, async state, styles réels, listes complexes, accessibilité ou écran externe fidèle. |
| Target Angular | Un sous-ensemble de template est traduit, incluant `@if` et `@for`.                                                                          | État/méthodes du composant, écran réel exécutable et fidélité Angular.                                        |
| CLI `convert`  | Écrit les écrans acceptés par un target et refuse les autres.                                                                                | Sélection de target propre aux douze sources, workspace mobile complet, transformation de workflow.           |
| Device/visuel  | Fixtures, companions et captures existent; le scénario records a une tolérance mesurée.                                                      | Transformation sans remplacement manuel d'un workflow externe, ni fidélité déclarée par framework.            |
| Distribution   | Installation par tarballs vérifiée.                                                                                                          | Installation publique complète par `npx navirox`.                                                             |

Un adapter T0, un companion manuel et une fixture de target ne comptent jamais
comme transformation fidèle d'un framework.

## Golden path : du repository au projet mobile

Le workflow utilisateur que toutes les milestones doivent améliorer est :

```bash
navirox transform ./my-web-app \
  --app apps/customer-portal \
  --profile vue-field-workflow \
  --out ./customer-mobile

cd ./customer-mobile
pnpm test
navirox build ios
navirox build android
```

`transform` orchestre discovery, préflight de capability, lowering, génération,
migration des unités approuvées, validation de provenance et scaffold du projet
mobile. Son résultat contient :

- `generated/`, intégralement régénérable;
- `shared/`, avec les unités portables et la décision qui les autorise;
- `manual/`, seulement pour les extensions ou écarts déclarés;
- `navirox.manifest.json`, qui lie source snapshot, profile, versions, coverage,
  fichiers, décisions et commandes de reproduction;
- les tests comportementaux, d'accessibilité et de capture du profil.

Un préflight `refused` ou `manual-discovery-required` s'arrête avant toute
écriture. `eligible-with-deltas` exige un flag qui accepte explicitement chaque
delta et les laisse dans le manifeste. `inspect` et `plan` restent des commandes
de diagnostic, mais aucune milestone de produit ne passe tant que le golden path
ne livre pas un projet généré et ne le fait pas tourner.

L'interface programmatique est son équivalent derrière un module profond :
`transform({ root, app, profile, output }) -> TransformResult`. Elle retourne
workspace, manifest, coverage, deltas/refus et commandes de validation sans que
le caller orchestre les adapters ou le runtime.

## Contrat de fidélité

Une claim concerne toujours un profil exact :

```text
<framework>@<version-range> / <topology profile> / <workflow profile> /
<target profile> / <device profiles>
```

| Dimension    | Exigence                                                                              | Preuve                                              |
| ------------ | ------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Structure    | Hiérarchie, répétitions et identifiants significatifs préservés ou écart déclaré.     | Manifest source -> IR -> sortie, test de structure. |
| Comportement | Même suite d'actions, mêmes états, effets et erreurs déclarés.                        | Journeys web/iOS/Android et tests de logique.       |
| Données/état | Modèles, validation, loading, vide, erreur et persistance sont implémentés ou exclus. | Tests de variantes et rapport d'écart.              |
| Interaction  | Saisie, sélection, scroll, navigation, gestes et a11y admis gardent leur effet.       | Tests device et arbre accessible.                   |
| Visuel       | Layout, style et motion passent les tolérances nommées.                               | Captures, mesure normalisée et revue.               |
| Opérationnel | Offline, reprise, permissions, performance et build sont mesurés ou exclus.           | Readiness matrix et build propre.                   |

Chaque fragment est `generated-and-proven`, `generated-with-declared-delta`,
`manual-required` ou `refused`. Une sortie incomplète est une erreur, pas un
best-effort silencieux.

## Architecture cible : source, lowering, target, runtime

Le graphe actuel reste un modèle d'analyse, pas un AST universel. La
transformation ajoute un IR uniquement lorsqu'au moins deux lowerings et un
target le nécessitent.

```text
Repository discovery -> SourceAdapter -> AppGraph + MigrationPlan
                                      -> SourceTransformProvider
                                      -> Workflow IR
                                      -> TargetProvider
                                      -> RuntimeProvider -> iOS / Android
```

Le futur `Workflow IR` doit rester une interface profonde et réduite :
`Workflow`, `Screen`, `ViewNode`, `Binding`, `Action`, `StateModel`,
`LayoutConstraint`, `StyleToken`, `Resource` et `Coverage`. `Coverage` relie
chaque node source à un node IR et à une sortie générée, manuelle ou refusée.

Le `SourceTransformProvider` réside avec la connaissance d'un framework et peut
employer son compilateur. Il ne connaît ni target ni runtime. Le
`TargetProvider` ne reçoit que l'IR et ne connaît aucun framework. Les packages
neutres restent sans imports de framework. Une donnée ne devient publique dans
l'IR qu'après deux providers ou un besoin de target démontré.

## Découverte de repository avant toute génération

La génération commence par une découverte de repository versionnée et
evidence-driven, jamais par l'hypothèse qu'un dépôt est un projet mono-package
conventionnel. Elle produit un `RepositoryCapabilityManifest` séparé de l'App
Graph et de la sortie générée.

### Pipeline obligatoire

1. **Topologie.** Énumérer racines Git, workspaces, packages, applications,
   bibliothèques partagées, generated directories, symlinks et frontières de
   lecture. Reconnaître pnpm, npm, Yarn, Bun, Nx, Turborepo et workspaces
   custom seulement avec une evidence précise.
2. **Résolution des packages.** Lire lockfiles, manifestes, overrides,
   catalogues et protocoles workspace. Enregistrer le package manager, la
   version, le graphe d'applications et les versions effectivement résolues,
   sans les deviner depuis un import.
3. **Détection framework/version.** Établir framework, major/minor et runtime
   via manifest, lockfile et config. Une détection ambiguë produit plusieurs
   candidats avec confiance, jamais un choix arbitraire.
4. **Configuration et plugins.** Lire uniquement les configs déclarées:
   Vite/Webpack/Rollup, framework configs, TypeScript paths, Babel, CSS,
   router, state/data plugins et scripts de génération. Enregistrer plugin,
   version, source location et niveau de compréhension.
5. **Entrées de build.** Identifier scripts, packages, entry points, routes,
   composition root et modes dev/build/test. Une entrée dynamique ou shell
   opaque est une escape hatch, pas une entrée à suivre.
6. **Conventions applicatives.** Les adapters relèvent routes, données, state,
   styles, assets, i18n, auth et tests selon les conventions de leur framework,
   avec source locations et confiance. Les conventions custom sont listées et
   non interprétées tant qu'un plugin de lowering n'est pas prouvé.
7. **Échappatoires.** Codegen, macros, eval, loaders propriétaires, DOM direct,
   WebGL/canvas, imports conditionnels, plugin maison, routes calculées,
   monorepo cross-boundary et dépendance non résolue sont déclarés
   `unsupported` ou `manual-required` avant lowering.

### Manifest et diagnostic

Le manifeste inclut : hash du snapshot, root/application sélectionnés, topology,
package manager, versions résolues, frameworks candidats, configs/plugins,
entries, conventions détectées, files lus, capabilities, escape hatches et
versions des adapters. Chaque fait a une location, une evidence et une confiance
`high|medium|low|unknown`.

Le rapport distingue quatre décisions : `eligible`, `eligible-with-deltas`,
`manual-discovery-required` et `refused`. Seul `eligible` peut avancer vers le
lowering. `eligible-with-deltas` exige un accord de profil qui énumère chaque
delta. Un changement du manifeste ou de ses hashes invalide le plan et la sortie
précédente jusqu'à requalification.

## Gouvernance des versions

Chaque adapter et SourceTransformProvider publie une matrice : framework,
versions vérifiées, topology profiles, plugins/configs admis, constructs,
escape hatches, target profiles, preuve et gate. Une plage npm ne devient jamais
un claim de compatibilité par elle-même.

Pour chaque version prise en charge, le corpus comprend une fixture positive,
limite et refusée, les lockfiles, config et snapshots de manifest. Les contract
tests exécutent discovery, graph, lowering, target, provenance et les journeys
du profil. Un watcher de releases upstream ouvre une requalification, pas un
upgrade automatique des ranges.

Une major, par exemple Vue 4, suit ce protocole :

1. fixer une fixture et lockfile Vue 4 séparés;
2. comparer discovery, graph et lowering Vue 3/Vue 4;
3. cataloguer chaque incompatibilité ou transform nécessaire;
4. faire tourner toutes les fixtures, builds, device journeys et captures;
5. publier le range seulement si toutes les gates concernées passent;
6. sinon retourner `outside-verified-range` avec alternative, sans génération.

Une version non vérifiée, un plugin inconnu ou une config custom non couverte
doit donner une erreur déterministe qui nomme le fait, la location, le profil
attendu et la voie de reprise. Il ne doit jamais produire une application mobile
que Navirox qualifierait d'équivalente.

## Gates de support

| Gate | Nom                         | Sortie                                                                 |
| ---- | --------------------------- | ---------------------------------------------------------------------- |
| T0   | Analyse                     | Découverte, inspection, versions et inconnues prouvées sur corpus.     |
| T1   | Lowering                    | Workflow IR déterministe avec couverture exhaustive.                   |
| T2   | Génération                  | Workspace généré et refus de toute couverture inconnue.                |
| T3   | Équivalence comportementale | Journeys web/iOS/Android des états et actions du profil.               |
| T4   | Fidélité visuelle           | Scénarios structure/style/motion dans leurs tolérances.                |
| T5   | Livraison                   | Build, provenance, rollback, a11y et release candidate reproductibles. |
| T6   | Support                     | Corpus/version governance, preuves externes et requalification active. |

Seul T6 autorise « supporté » pour le profil exact. Aucun fallback vers le
target Vue ne compte comme support d'un autre framework.

## Matrice de destination

| Famille          | Situation                  | Programme de transformation fidèle                                             |
| ---------------- | -------------------------- | ------------------------------------------------------------------------------ |
| Vue 3            | T0, target étroit          | Lowering `script setup`, Router, state/style admis, T3 puis T4.                |
| Nuxt             | T0                         | Pages/layouts/composables client; SSR, middleware et serveur exclus au départ. |
| Svelte/SvelteKit | T0                         | Blocks, bindings, stores, puis routes/layouts client.                          |
| Angular          | T0, template target étroit | Components, signals, forms et DI bornée avant génération.                      |
| React/Next       | T0                         | JSX/hooks, puis client/server, App/Pages Router séparés.                       |
| Astro            | T0                         | Shell + orchestration d'îlots déjà couverts, aucun backdoor.                   |
| Solid/Qwik       | T0                         | Providers séparés de réactivité et sérialisation.                              |
| Lit              | T0                         | Propriétés, slots, événements; custom elements non couverts refusés.           |
| Vanilla          | T0                         | Profil DOM/modules/événements contrôlé; JS dynamique refusé.                   |

## Backlog explicite de spécifications

### P0. Truth, états OpenSpec et matrice machine-readable

**Dépendances :** aucune.

- [ ] Réconcilier tâches OpenSpec, code, tests, evidence et claims publics;
      archiver seulement les changements réellement prouvés.
- [ ] Terminer ou redécouper `angular-target-runnable-conversion`; ne pas le
      présenter comme conversion Angular avant script et device proof.
- [ ] Publier `framework/profile/gate/evidence/version` machine-readable.
- [ ] Faire échouer les docs/CI lorsqu'une capacité T1+ n'a pas fixture, commande
      et artefact de preuve.

**Acceptation :** aucune tâche cochée n'est une intention, et la matrice, README
et OpenSpec racontent la même vérité.

### P1. Repository discovery et version governance

**Dépendances :** P0.

- [ ] Spécifier et implémenter le `RepositoryCapabilityManifest` et le pipeline
      de découverte ci-dessus dans un package neutre.
- [ ] Ajouter fixtures conventional repo, pnpm/npm/Yarn workspace, Nx/Turbo
      monorepo et configuration custom refusée pour Vue, Angular, React et Svelte.
- [ ] Construire les diagnostics de confiance, collision, version hors range et
      escape hatch avec messages déterministes.
- [ ] Ajouter une matrice par adapter/version/plugin/profile et contract tests
      de requalification.
- [ ] Écrire le protocole de montée de major, initialement exercé sur une fixture
      de major non vérifiée plutôt que prétendre déjà supporter Vue 4.

**Acceptation :** un dépôt ambigu, monorepo ou hors range ne peut atteindre le
golden path sans manifest `eligible` vérifié.

### P2. Workflow IR et seams de lowering

**Dépendances :** P1. Le design doit démontrer deux lowerings candidats, Vue et
Angular ou Svelte, et un target fake avant code de production.

- [ ] Versionner Workflow IR, coverage, provenance, hashes et migrations.
- [ ] Définir `SourceTransformProvider.lower()` et `TargetProvider.emit()` sans
      imports croisés; renforcer les tests de seams.
- [ ] Ajouter les erreurs de construct, dépendance, ressource, ambiguïté et
      limitation native.
- [ ] Écrire deux fixtures de lowering contrastées et le contract suite commune.

**Acceptation :** aucun nom/AST framework ne fuit dans l'IR, et un node sans
coverage empêche l'émission.

### P3. Vue : premier workflow fidèlement généré

**Dépendances :** P2.

- [ ] Abaisser `script setup`, props/emits, refs/reactive/computed, events,
      conditionnels, boucles et v-model admis; refuser code dynamique, render
      functions et watchers non modélisés.
- [ ] Ajouter un profil Vue Router avec params et navigation native; guards et
      routes calculées sont refusés.
- [ ] Migrer composables/stores purs seulement avec tests de dépendances et de
      comportement; le reste devient manuel.
- [ ] Générer primitives, a11y, test IDs, styles/tokens, variants et manifests.
- [ ] Étendre styles par valeurs prouvées: flex, dimensions, spacing, couleur,
      typo, images. Refuser cascade, pseudo-classes, media queries et CSS
      dynamique non modélisés.
- [ ] Générer une fixture de workflow complète avec vide, erreur, loading,
      interactions, capture web/iOS/Android et zéro écran manuel.

**Acceptation :** un commit Vue épinglé exécute le golden path et produit un
workspace hash-stable, T3 sur iOS/Android et T4 dans les tolérances documentées.

### P4. Nuxt et ergonomie de migration

**Dépendances :** P3 T3; P4a/P4b peuvent être deux changements indépendants.

**P4a Nuxt**

- [ ] Abaisser pages, layouts, `definePageMeta`, routes filesystem et
      composables client avec provenance de convention.
- [ ] Déclarer SSR, middleware, server routes et données réelles comme exclus
      jusqu'à profils dédiés.
- [ ] Prouver deep link, loading, vide et erreur sur une fixture Nuxt.

**P4b Workspace**

- [ ] Scaffolder `generated/`, `manual/`, `shared/`, manifests, commandes de
      régénération et ownership des fichiers.
- [ ] Détecter les edits generated et imposer régénération, extension ou patch
      nommé; ne jamais les écraser silencieusement.
- [ ] Étendre `migrate` au workflow: dry-run, diff, apply, rollback et comparaison
      de plan/source revision.
- [ ] Tester hors monorepo depuis tarball ou installation publique vérifiée.

**Acceptation :** Nuxt atteint T3 pour un workflow sans SSR et une équipe peut
régénérer/restaurer sans perdre le code manuel.

### P5. Vue/Nuxt qualité et gouvernance de compatibilité

**Dépendances :** P3, P4.

- [ ] Constituer corpus positif/limite/refusé par capability, avec lockfiles,
      devices, fonts et hashes.
- [ ] Lier chaque construct à lowering, entrée de compatibilité, test négatif et
      preuve device si visible.
- [ ] Mesurer structure, hit targets, focus/a11y, state variants et motion en
      plus de la grille visuelle.
- [ ] Invalider les preuves après changement de source, target, runtime, renderer
      ou device profile jusqu'à requalification.
- [ ] Qualifier deux repos Vue/Nuxt externes sans copier code, données, assets
      ou marque.

**Acceptation :** Vue/Nuxt T5 et toute ligne de compatibilité est reliée à une
version, fixture et commande reproductible.

### P6. Svelte et SvelteKit

**Dépendances :** P2, P4b, P5.

- [ ] Profil Svelte pour markup, `{#if}`, `{#each}`, bindings, events, stores et
      réactivité; slots/actions/transitions/dynamique explicitement classés.
- [ ] Lowering sans import target, contract suite commune avec Vue.
- [ ] Profil SvelteKit pages/layouts/params/navigation client; endpoints/SSR
      refusés au départ.
- [ ] Workflows Svelte et SvelteKit distincts avec journeys et captures.

**Acceptation :** T4 pour un profil Svelte et SvelteKit, sans sémantique Vue dans
le core.

### P7. Angular

**Dépendances :** P2, P5.

- [ ] Finir le minimum actif: état littéral, signals, méthodes bornées, fixture
      iOS/Android. Tout le reste reste refusé.
- [ ] Lowerer composants standalone, templates, blocks, bindings, signals et
      formulaires réactifs limités.
- [ ] Modéliser services purs/ports neutres; refuser DI runtime, lifecycle, RxJS
      arbitraire, decorators non modélisés et Material jusqu'à profils dédiés.
- [ ] Mapping routes/params vers navigation native, guards exclus.

**Acceptation :** T3 Angular signal/formulaire borné, puis T4 sans écran manuel.

### P8. React et Next

**Dépendances :** P2, P5.

- [ ] Lowering JSX, composants fonctionnels, props, state, callbacks, listes et
      conditionnels; classes, refs impératives et effets arbitraires refusés.
- [ ] Migration de hooks purs, contexte et stores avec tests comportementaux;
      aucun hook DOM copié dans le runtime.
- [ ] Profils Next App Router et Pages Router séparés; server/client, actions et
      middleware explicitement exclus ou transformés dans une proposition dédiée.
- [ ] Générer workflows React et Next client avec matrice package/version.

**Acceptation :** T3 React et Next client, sans confusion de code serveur.

### P9. Astro, Solid, Qwik, Lit et Vanilla

**Dépendances :** P2 et une demande attestée par famille; Astro dépend aussi des
frameworks enfants qu'il compose.

- [ ] Astro: shell, routes statiques, provenance d'îlot et délégation uniquement
      à des providers déjà prouvés; îlot non couvert refusé.
- [ ] Solid/Qwik: providers séparés de réactivité/sérialisation et corpus propre.
- [ ] Lit: propriétés, slots, événements; custom elements non couverts refusés.
- [ ] Vanilla: profil DOM/modules/events contrôlé; JavaScript dynamique refusé.
- [ ] Atteindre T3 par famille avant d'ouvrir la suivante.

**Acceptation :** chaque famille a un profil et une fixture propre, sans adapter
générique fictif ni claim de support avant T6.

### P10. Livraison et support durable

**Dépendances :** P5 et au moins deux familles T3. Release peut commencer après
Vue/Nuxt T5.

- [ ] Finir l'installation publique ou garder honnêtement tarball jusqu'à ce que
      les dépendances soient publiées.
- [ ] Builds iOS/Android, release candidates, provenance, SBOM et licences.
- [ ] Budgets bundle, start, mémoire et interaction par profile/device en CI.
- [ ] Politiques de version, dépréciation, upgrade de manifest et requalification.
- [ ] Procédure de reproduction incluant profile, manifest et artefacts sans
      fuite de code source.
- [ ] Cloud, connecteurs, SSO et SLA seulement après demande, threat model,
      autorisation et exploitation humaine.

**Acceptation :** un profil T6 est installable, régénérable, constructible,
auditable et supportable hors monorepo.

## Gates de sortie produit

| Sortie                     | Conditions                                                                                                | Claim permis                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Developer preview          | P0/P1, installation ou limite tarball explicite, golden path qui refuse proprement les profils hors range | Préflight de conversion pour profils listés.                 |
| Vue transformation preview | P2/P3 T3/P4b                                                                                              | Golden path Vue: workflow généré avec couverture/provenance. |
| Vue/Nuxt fidelity preview  | P4a/P5 T4                                                                                                 | Fidélité mesurée des scénarios nommés.                       |
| V1 delivery                | Vue T5, Nuxt T3, P10 release candidate                                                                    | Migration accompagnée et reprise manuelle explicite.         |
| Multi-framework V1         | Vue/Nuxt T5 + Svelte/SvelteKit et Angular/React T3 selon demande                                          | Profils de transformation par framework.                     |
| Support durable            | Un profil T6                                                                                              | Support du profil, versions et exclusions exacts.            |

## Règles OpenSpec et non-objectifs

Chaque proposition nomme framework, range de versions, topology, profile,
devices, fixture positive/limite/refusée, commands, evidence, coverage et
exclusions. Elle ne touche qu'un seam à la fois; si le contrat doit évoluer, ce
contrat est une proposition préalable. Publication, credentials, connector réel,
store, données externes et marques demandent une autorisation séparée.

Sont exclus en permanence : compilateur universel, conversion automatique de
toutes les views/CSS, WebView présenté comme natif, LLM qui reçoit le code ou
décide la compatibilité, fuite des abstractions Symbiote/React Native/Expo dans
l'API Navirox, et cloud enterprise sans preuves de valeur, sécurité et
opérations.

Le découpage OpenSpec, les critères d'acceptation et les prompts d'orchestration
OpenCode sont dans [`OPENCODE-TRANSFORMATION-PROGRAM.md`](OPENCODE-TRANSFORMATION-PROGRAM.md).
