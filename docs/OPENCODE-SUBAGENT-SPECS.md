# Specs de délégation OpenCode

État relevé le 23 septembre 2026. Cette page transforme les changements
OpenSpec actifs en lots exécutables par des subagents isolés. Elle ne change ni
la promesse produit ni les contrats publics.

## État de départ

- `corepack pnpm test` est vert localement : 60 tâches Turbo réussissent.
- Six changements OpenSpec sont présents. Cinq sont marqués complets mais
  encore ouverts : `angular-target-conversion`, `cli-screen-conversion`,
  `convert-target-selection`, `vue-target-directive-breadth` et
  `vue-target-presentational-breadth`.
- `angular-target-runnable-conversion` est le travail produit réellement
  inachevé : 1 tâche sur 7. Les blocs Angular sont traduits, mais le composant
  produit n'a ni état ni méthodes, donc ne peut pas s'exécuter.
- `optional-llm-assistance` est indépendant mais inachevé : son comportement
  existe dans `planner` et `cli`; il manque la spécification stable et la preuve
  des garanties annoncées.
- Le répertoire de travail contient déjà des changements non commités. Chaque
  subagent doit travailler dans son propre worktree et ne doit modifier que les
  chemins de son lot.

## Ordre d'exécution

| Rang | Changement                             | Dépend de                    | Peut être parallèle avec           |
| ---- | -------------------------------------- | ---------------------------- | ---------------------------------- |
| 0    | clôture des changements terminés       | aucun                        | rien qui édite les mêmes OpenSpec  |
| 1    | composant Angular exécutable           | clôture 0                    | assistance LLM                     |
| 2    | contrat et preuves de l'assistance LLM | clôture 0                    | composant Angular exécutable       |
| 3    | preuve Angular de bout en bout         | composant Angular exécutable | rien qui touche le harness Angular |

Les lots 1 et 2 peuvent être confiés à deux subagents. Le lot 3 doit attendre
la fusion du lot 1 : il dépend de son API et de la fixture compilable.

## Lot 0 : clôturer les changements OpenSpec achevés

**Changement :** aucun nouveau changement. Traiter uniquement les cinq
changements dont `openspec list` annonce `Complete` :
`angular-target-conversion`, `cli-screen-conversion`,
`convert-target-selection`, `vue-target-directive-breadth` et
`vue-target-presentational-breadth`.

**But :** archiver la preuve déjà achevée, sans modifier le code de production.

**Contraintes :** vérifier que les tâches cochées correspondent aux fichiers et
tests présents avant tout archivage. Ne pas archiver
`angular-target-runnable-conversion` ni `optional-llm-assistance`.

**Acceptation :**

1. `corepack pnpm exec openspec validate <change> --strict` réussit pour chacun.
2. Chaque dossier est déplacé selon la convention `openspec archive` du projet.
3. `corepack pnpm exec openspec list` ne montre plus ces changements ouverts.
4. Aucun fichier de `packages/` n'est modifié.

**Prompt OpenCode :**

> Dans un worktree isolé de Navirox, clôture exclusivement les changements
> OpenSpec complets suivants : angular-target-conversion, cli-screen-conversion,
> convert-target-selection, vue-target-directive-breadth et
> vue-target-presentational-breadth. Lis AGENTS.md et docs/EXECUTION-CHARTER.md.
> Vérifie strictement chaque changement, archive-le avec la convention existante
> du dépôt, puis vérifie que `openspec list` ne le laisse plus actif. Ne modifie
> aucun code sous packages/, ne touche pas aux deux changements inachevés et ne
> reformate pas le dépôt entier. Rapporte les commandes et résultats.

## Lot 1 : rendre le composant Angular généré exécutable

**Changement existant :** `angular-target-runnable-conversion`.

**But :** finir les tâches 2.1 et 2.2 du changement actif. Ajouter une entrée
`compileAngularComponent({ template, script, filename, outputPath })` dans
`@memolabs-apps/target-angular` et faire passer la source du composant par
`navirox convert`.

**Périmètre autorisé :**

- `packages/target-angular/**`
- `packages/cli/src/cli.ts`, `packages/cli/src/targets.ts` et leurs tests
- les tâches et le delta OpenSpec de ce changement, seulement si nécessaire
  pour refléter l'implémentation vérifiée.

**Contrat à implémenter :**

1. Le compilateur accepte un template et le script du même composant.
2. Il traduit seulement des champs de classe avec initialiseur littéral, des
   champs `signal(...)`, et des méthodes simples nécessaires aux liaisons du
   template.
3. Il émet un SFC Vue avec un `script setup` dont toutes les liaisons générées
   sont déclarées. Une interpolation, un `v-if`, un `v-for`, un événement
   `@press` et un `v-model` ne doivent pas référencer un identifiant absent.
4. Constructor DI, décorateurs, hooks de cycle de vie, RxJS, pipes, classes ou
   méthodes hors sous-ensemble produisent un finding explicite et **aucun**
   `code` généré. Étendre le type de finding sans rendre les erreurs ambiguës.
5. Le CLI conserve la lecture inline/externe existante, mais fournit aussi le
   script source au target Angular. Les chemins Vue et les autres source adapters
   restent inchangés.

**Interdits :** importer Angular, son compilateur, `@symbiote-native/*`, React
Native ou une API runtime dans `target-angular` ou `cli`; inférer un état absent
depuis le template; accepter silencieusement une syntaxe inconnue; changer un
type public d'un autre package.

**Tests obligatoires :**

- cas positif combinant champ littéral, signal, méthode et les bindings déjà
  supportés;
- refus de chaque famille hors sous-ensemble, avec finding et sans code;
- test CLI prouvant que le script est passé au target Angular;
- non-régression Vue dans le CLI.

**Acceptation :**

```bash
corepack pnpm --filter @memolabs-apps/target-angular test
corepack pnpm --filter @memolabs-apps/cli test
corepack pnpm build
corepack pnpm lint
corepack pnpm format:check
corepack pnpm exec openspec validate angular-target-runnable-conversion --strict
```

Cocher les tâches 2.1 et 2.2 seulement après ces preuves. Ne pas entreprendre
les tâches 3.1 et 3.2 dans ce lot.

**Prompt OpenCode :**

> Implémente uniquement les tâches 2.1 et 2.2 de
> `openspec/changes/angular-target-runnable-conversion`. Lis AGENTS.md,
> docs/EXECUTION-CHARTER.md, le proposal/design/tasks de ce changement, puis
> l'implémentation de `packages/target-angular/src/index.ts` et le chemin convert
> dans `packages/cli`. Ajoute `compileAngularComponent` avec un traducteur fermé
> pour champs littéraux, signals et méthodes simples; un élément hors périmètre
> doit donner un finding et ne jamais produire de code. Passe le script Angular
> au target depuis le CLI sans casser Vue. Écris les tests positifs, les refus et
> le câblage CLI. N'effectue ni device run ni travail de preuve externe. Termine
> par les six commandes d'acceptation et fournis le résultat exact.

## Lot 2 : stabiliser et prouver l'assistance LLM optionnelle

**Changement existant :** `optional-llm-assistance`.

**But :** achever ses dix tâches, principalement de spécification et de tests,
sans étendre la capacité au-delà du second avis déjà présent.

**Périmètre autorisé :**

- `openspec/changes/optional-llm-assistance/**` et le spec delta stable associé;
- `packages/planner/src/semantics*`, exports associés et leurs tests;
- `packages/cli/src/plan.test.ts`, le rendu/CLI strictement nécessaires;
- `docs/DEVELOPER-PREVIEW.md` seulement si une divergence factuelle est trouvée.

**Invariants :**

1. Sans `--semantic`, aucune clé n'est lue, aucun provider n'est importé et
   aucun appel réseau ne peut être initié.
2. Avec le flag mais sans clé, l'erreur lisible nomme la variable requise et ne
   produit aucune suggestion.
3. Seuls les sujets `manual` ou `unknown` partent au juge. Les données envoyées
   se limitent à des identifiants et types, jamais au contenu source.
4. Une réponse hors `MIGRATION_CLASSES` devient `unknown`; une suggestion ne
   modifie jamais une décision; la sortie JSON et texte les sépare et nomme le
   modèle.
5. Les tests injectent un faux juge : aucune clé réelle ni réseau n'est admis.

**Interdits :** rendre l'option obligatoire, ajouter un upload de source,
promettre que le LLM décide une compatibilité, ou faire fuiter un type SDK dans
un package public.

**Acceptation :**

```bash
corepack pnpm --filter @memolabs-apps/planner test
corepack pnpm --filter @memolabs-apps/cli test
corepack pnpm build
corepack pnpm lint
corepack pnpm format:check
corepack pnpm exec openspec validate optional-llm-assistance --strict
```

**Prompt OpenCode :**

> Finalise exclusivement `optional-llm-assistance` dans un worktree isolé.
> Traite la capacité comme un second avis opt-in, jamais comme une décision.
> Commence par comparer `proposal.md`, `design.md`, `tasks.md` et le delta à
> `planner/src/semantics.ts` et aux tests CLI. Ajoute le spec delta manquant et
> des tests déterministes qui prouvent les six invariants du changement, avec un
> faux juge et sans réseau. Corrige le code seulement si une garantie déclarée
> n'est pas réellement tenue. Ne touche ni aux targets ni à l'Angular runnable
> conversion. Lance toutes les commandes d'acceptation et coche seulement les
> tâches démontrées.

## Lot 3 : preuve Angular de conversion jusqu'aux appareils

**Changement existant :** `angular-target-runnable-conversion`, tâches 3.1 à
4.2. Ne l'ouvrir qu'après le lot 1 fusionné et le baseline vert.

**But :** prouver un seul composant Angular, issu d'une révision publique
épinglée et d'une fixture autorisée, de la conversion au comportement sur iOS et
Android. C'est une preuve de sous-ensemble, pas une promesse de conversion
générique ni une intégration SuiteCRM.

**Préparation obligatoire :** choisir le composant déjà justifié par
`docs/evidence/workflow-suitecrm-record-workflow.md` et
`packages/source-angular/fixtures/record-workflow/`, ou arrêter et ouvrir un
nouveau changement si ce composant ne rentre pas dans le sous-ensemble fermé.
Ne contourner aucun refus en réécrivant manuellement le résultat généré.

**Livrables :**

1. Un test de conversion sur fixture épinglée qui vérifie que chaque binding
   généré est déclaré, ainsi que la provenance du template et du composant.
2. Une intégration du SFC généré dans le harness natif existant, sans WebView.
3. Une séquence d'actions unique pour iOS et Android, incluant au moins une
   interaction déclarée et une réinitialisation déterministe.
4. Des artefacts de capture et un rapport qui séparent succès comportemental,
   capture visuelle et limites connues.
5. Les mises à jour minimales de l'évidence et de la readiness matrix requises
   par un résultat réel. Une plateforme indisponible est écrite comme telle, pas
   simulée comme un succès.

**Interdits :** compte, credential, API SuiteCRM réelle, connecteur, données ou
assets SuiteCRM, WebView, métrique de parité visuelle, support général Angular.

**Acceptation :** les quatre tâches restantes sont cochées seulement si les
builds propres et les exécutions iOS/Android ont été réellement obtenus et que
les artefacts permettent de les reproduire. Finir par le baseline complet et :

```bash
corepack pnpm exec openspec validate angular-target-runnable-conversion --strict
```

**Prompt OpenCode :**

> Après fusion du lot `compileAngularComponent`, réalise les tâches 3.1 à 4.2
> de `angular-target-runnable-conversion`, rien d'autre. Lis toute la charte,
> l'OpenSpec actif, les preuves Angular existantes et le harness de capture.
> Utilise la fixture Angular autorisée et garde la frontière source/runtime
> intacte. Prouve la conversion d'un composant borné, puis exécute la même
> séquence comportementale sur iOS et Android depuis une build propre. Conserve
> provenance, commandes, résultats et limites. Si un appareil n'est pas
> disponible, enregistre l'indisponibilité et laisse la tâche non cochée au lieu
> de fabriquer une preuve. Ne fais aucun appel réseau ni intégration SuiteCRM.

## Hors file immédiate

Ne pas ouvrir de nouvelle spec de fonctionnalité Vue, source adapter ou
distribution avant la clôture de ces lots. Les preuves de parcours Vue et
Angular existent déjà dans `docs/evidence/`, mais le contrat de preview rappelle
qu'une installation publique `npx navirox` n'est pas démontrée. La publication
ou le passage au support public exigera un changement OpenSpec distinct et une
autorisation explicite.
