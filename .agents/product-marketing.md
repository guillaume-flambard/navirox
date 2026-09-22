# Navirox: contexte produit et marketing

**Version :** 1.0  
**Date :** 2026-09-20  
**Statut :** canonique pour le positionnement commercial. Les faits techniques restent
dans `docs/evidence/`, les limites visuelles dans `docs/VISUAL-FIDELITY.md`.

## Vision et réalité actuelle

### Vision de catégorie

Navirox vise à devenir la plateforme open source de référence qui permet à une
équipe de faire évoluer une application web existante vers une application
mobile native, quel que soit son framework source. À maturité, le geste attendu
est simple : analyser son dépôt, générer un espace mobile natif, conserver ce
qui est portable, adapter le reste avec une provenance explicite, vérifier le
rendu et livrer.

L'ambition n'est donc pas d'être une petite agence autour de Vue. C'est de
devenir une marque, un CLI, un écosystème de cibles et d'adaptateurs, une norme
de compatibilité et une communauté de contributeurs pour le passage web vers
mobile. Vue et Nuxt sont le point d'appui initial, pas la frontière du produit.

### Réalité actuelle

Navirox aide une équipe qui possède déjà une application web mature à identifier
ce qui peut être réemployé pour un compagnon mobile natif, ce qui bloque la
migration, puis à livrer ce compagnon de façon incrémentale.

Le produit est aujourd'hui un outillage open source de diagnostic et de preuve,
complété par une offre de découverte et d'implémentation. L'expérience
« analyser, migrer et livrer » est la direction du produit, mais elle n'est pas
encore démontrée pour une application arbitraire, tous frameworks confondus.
Cette précision protège la vision : la marque ne doit jamais croître plus vite
que la preuve qui la rend crédible.

## Public cible

La première cible commerciale est une entreprise de produit B2B de 15 à 250
personnes qui réunit les signaux suivants :

- une application web TypeScript maintenue, Vue ou Nuxt en priorité ;
- une API et une authentification déjà exploitables ;
- des utilisateurs qui travaillent en déplacement, sur le terrain ou hors du
  poste de bureau ;
- pas d'application mobile native satisfaisante ;
- un flux mobile étroit, à forte valeur, identifiable avant toute réécriture.

Les acheteurs sont le CTO, VP Engineering, dirigeant produit ou fondateur. Le
développeur web senior est l'influenceur technique. L'utilisateur terrain est
la personne qui valide la valeur du flux livré.

## Problèmes à résoudre

1. Une entreprise web ne sait pas quelle part de son code et de ses parcours est
   réellement réutilisable sur mobile.
2. Une réécriture native paraît risquée, longue et difficile à chiffrer.
3. Un wrapper web peut suffire à court terme, mais ne répond pas toujours aux
   attentes de navigation, caméra, notifications, offline ou ergonomie native.
4. Le produit desktop entier n'est généralement pas le bon périmètre mobile.

Le travail à vendre est donc une réduction mesurable de l'incertitude, suivie
d'un compagnon mobile utile. Il ne s'agit pas de promettre la transposition
automatique d'une application web complète.

## Personas

| Persona              | Situation                                                | Ce qu'il veut acheter                                         | Risque à lever                                   |
| -------------------- | -------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| CTO / VP Engineering | Une roadmap web chargée et une demande mobile récurrente | Un diagnostic sérieux et un chemin technique                  | Créer une deuxième base de code ingérable        |
| Product lead         | Un usage mobile mal servi mais pas encore cadré          | Un premier flux livrable et testable                          | Financer un clone desktop inutile                |
| Senior web developer | Il connaît les composants et les compromis actuels       | De la provenance, des limites explicites, des PR exploitables | Un outil magique qui cache ses approximations    |
| Opérateur terrain    | Il travaille avec formulaires, photos, statuts ou listes | Moins de friction sur téléphone                               | Une interface desktop compressée sur petit écran |

## Alternatives et différenciation

| Alternative                        | Bonne réponse quand                                          | Limite face à Navirox                                                             |
| ---------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Capacitor / wrapper web            | L'app web est déjà mobile-first et le besoin natif est léger | Il exécute le web dans un runtime ; il ne produit pas une vue native indépendante |
| Réécriture par une agence          | Le périmètre est déjà clair et le budget est sécurisé        | Le risque de cadrage et de duplication apparaît avant la première ligne de code   |
| NativeScript ou un framework natif | L'équipe accepte d'écrire une interface spécifique           | Il faut tout de même décider quoi porter et comment le faire                      |
| Ne rien faire / PWA                | Le mobile ne porte pas de flux prioritaire                   | Le besoin terrain continue de contourner le produit                               |

La différence de Navirox doit rester vérifiable : un rapport de compatibilité
avec provenance, une liste de blocages et un plan de portage, puis des preuves
de rendu et de comportement pour les flux effectivement livrés.

## Positionnement et objections

**Promesse de vision :** « Passez de votre application web à une application
mobile native, progressivement et avec une traçabilité complète. »

**Promesse à publier aujourd'hui :** « Identifiez le bon premier flux mobile de
votre app web, avec une preuve technique avant de financer sa réalisation
native. »

| Objection                                             | Réponse honnête                                                                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| « Pourquoi ne pas installer Capacitor ? »             | C'est souvent une excellente option. Navirox aide à décider si un wrapper suffit ou si un flux natif apporte une valeur supérieure.  |
| « Est-ce que vous convertissez tout notre produit ? » | Non. Le point de départ est un flux mobile prioritaire. Les composants incompatibles sont signalés, jamais masqués.                  |
| « Est-ce que le rendu sera identique ? »              | Seulement lorsqu'une preuve de fidélité reproductible existe. La parité visuelle globale n'est pas encore une promesse produit.      |
| « Pourquoi une mission plutôt qu'un outil seul ? »    | L'outil rend le diagnostic plus rapide et traçable. La mission transforme ce diagnostic en décision, puis en application utilisable. |

## Crédibilité fondatrice et offre initiale

Navirox ne doit pas présenter son fondateur comme un studio mobile déjà établi
sur une longue série de sorties App Store ou Google Play. Cette affirmation ne
serait pas encore vraie. La crédibilité initiale repose sur quatre éléments
vérifiables :

1. l'expérience d'ingénierie web et produit sur des applications existantes ;
2. un diagnostic de dépôt qui cite les fichiers, routes, dépendances et limites ;
3. une démonstration native installable, avec son code, ses tests et ses écarts
   déclarés ;
4. une mission vendue à un périmètre que ces preuves couvrent réellement.

Le rôle à annoncer est : **ingénieur produit web vers mobile et créateur de
Navirox**. Ce rôle ne promet pas de remplacer une équipe mobile entière. Il
propose de choisir, prouver et préparer le premier parcours mobile natif d'un
produit web.

### Offre à signer en premier

**Navirox Mobile Readiness Sprint** est une découverte à prix fixe d'une semaine.
Elle livre :

- une analyse de la révision choisie du produit web ;
- l'inventaire des parcours, du code réemployable et des blocages ;
- le choix argumenté d'un seul parcours mobile ;
- un prototype natif testable ou une conclusion explicite de non-faisabilité ;
- un registre des risques, un plan de livraison et un chiffrage de la phase
  suivante.

Elle ne livre pas automatiquement une application publiée sur les stores, une
parité visuelle générale, des intégrations sensibles ou une promesse offline.
Ces éléments deviennent une phase distincte seulement après les preuves et les
critères d'acceptation nécessaires. Le prix de lancement est une hypothèse à
tester, entre 2 000 et 3 000 EUR HT, avec un acompte avant le démarrage et un
solde à la remise des livrables.

La première application publiée sous Memo Labs apporte une preuve de processus
de build, test, distribution et publication. Elle ne transforme pas une mission
ultérieure en référence client : les références, logos et résultats client ne
sont publiés qu'avec accord écrit.

## Cibles à éviter au départ

- application native-first ou greenfield ;
- absence d'API maintenue ou de propriétaire produit disponible ;
- demande de copier un éditeur desktop complexe écran par écran ;
- produit de signature ou de santé soumis à une conformité lourde, tant que le
  modèle de sécurité et d'audit mobile n'est pas prouvé ;
- client qui veut une estimation ferme sans atelier de découverte.

## Langage client à valider

Les formulations ci-dessous sont des hypothèses, pas des citations clients :

- « Nous avons des utilisateurs qui font encore cela depuis leur téléphone. »
- « Nous ne savons pas si cela justifie une équipe mobile dédiée. »
- « Nous voulons tester un parcours terrain sans réécrire notre back-office. »
- « Nous avons besoin d'une application distribuable, pas d'une démo. »

Chaque entretien doit conserver les mots exacts du prospect, avec la source et
son accord d'usage avant toute publication.

## Preuves actuelles

- Le benchmark public Baserow documente 46 routes et 41 écrans Nuxt détectés
  sur un commit figé. Voir `docs/benchmarks.md` et `docs/pilots/baserow.md`.
- Le benchmark Cal.com documente une analyse Next et une référence sémantique
  vers une application Expo. Ce n'est pas une comparaison de pixels.
- Le compilateur Vue est un jalon V0 étroit : il bloque l'émission lorsque la
  structure ou le CSS sort de son sous-ensemble sûr.
- La preuve visuelle native indépendante est en cours. Les limites sont
  contractuelles dans `docs/VISUAL-FIDELITY.md`.

Il est interdit de transformer ces éléments en étude de cas client, en
partenariat, en compatibilité exhaustive ou en promesse EAS sans preuve
additionnelle et autorisation explicite.

## Construction de la marque et de la communauté

La croissance souhaitée ressemble à celle d'un outil développeur, pas à celle
d'une agence qui cache ses méthodes :

1. un CLI mémorisable, installé localement, utile sans compte ;
2. des adaptateurs et des cibles découplés, chacun avec son contrat, ses tests
   et son mainteneur possible ;
3. une matrice de compatibilité publique et versionnée ;
4. des benchmarks reproductibles et des démonstrations visuelles qui deviennent
   des références partagées par les communautés Vue, Angular, React et Expo ;
5. une documentation de contribution qui transforme un rapport de blocage en
   issue, test de régression ou nouvel adaptateur ;
6. à terme, des offres entreprises autour de la gouvernance, CI, registre privé,
   support et livraison, sans fermer le coeur open source.

Le signal recherché au début est moins le volume que l'apport extérieur : une
issue techniquement utile, un benchmark ajouté, une correction d'adaptateur ou
une équipe qui réexécute le rapport. Les étoiles sont bienvenues, mais ne sont
pas le mécanisme de confiance principal.

## Objectifs de mise sur le marché

Avant le 15 novembre 2026 :

1. 20 comptes qualifiés, chacun avec un signe public de fit et une source.
2. 3 conversations qualifiées avec un décideur ou un propriétaire produit.
3. 1 découverte payante encaissée ou, à défaut, une mission signée dont le
   périmètre, le prix et la date de paiement sont explicites.

Les indicateurs intermédiaires sont les demandes de démonstration, les retours
sur le rapport et les objections répétées. Les étoiles GitHub ou impressions de
contenu ne sont pas des preuves de demande payante.

## Voix de marque

Technique, précise et calme. Montrer la provenance, les limites et le prochain
test. Éviter « révolutionnaire », « automatique », « sans effort », « parité
garantie » et toute comparaison non mesurée.

## Journal des changements

| Version | Date       | Changement                                                                                                  |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| 1.2     | 2026-09-20 | Cadre la crédibilité fondatrice et l'offre de découverte à signer avant une livraison Store.                |
| 1.1     | 2026-09-20 | Sépare la vision de plateforme universelle et l'exécution commerciale initiale ; ajoute le plan communauté. |
| 1.0     | 2026-09-20 | Première formalisation : outillage open source, découverte payante et compagnon mobile incrémental.         |
