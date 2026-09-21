# Plan d'entrée marché : visibilité, retours et premières missions

**Statut :** plan opératoire, pas une promesse publique  
**Dernière mise à jour :** 2026-09-20  
**Objectif :** obtenir vite des retours de praticiens et une première découverte
payante, sans attendre qu'un projet open source finance seul son développement.

## Horizon : une grande marque développeur, sans fausse promesse

La cible longue est ambitieuse : Navirox doit devenir la référence pour une
équipe qui veut passer du web au mobile natif. Un développeur doit pouvoir
penser « j'ai un dépôt web, je commence par Navirox », comme il pense aujourd'hui
à un outil de build, de déploiement ou de diagnostic.

Cette ambition implique une plateforme, pas seulement des missions : CLI
installable, adaptateurs pour les frameworks source, cibles de rendu,
compatibilité versionnée, preuves visuelles, CI, documentation et un écosystème
où des mainteneurs externes peuvent ajouter un framework sans dépendre du
fondateur.

Le piège serait de choisir entre « projet de consulting » et « plateforme
mondiale ». Le premier finance l'apprentissage et fournit les cas réels ; la
seconde dicte l'architecture, la licence et la façon de publier les preuves.

## Décision stratégique

Navirox entre sur le marché par une boucle à deux sorties :

```text
preuves techniques publiques -> retours de développeurs -> amélioration du produit
                 |                                      |
                 v                                      v
diagnostic ciblé d'une app web -> découverte payante -> compagnon mobile livré
```

L'open source est le canal de crédibilité et de découverte. Le revenu initial
vient de la réduction de risque et de la réalisation du premier flux mobile.
Une offre cloud ou SaaS ne sera examinée qu'après une demande répétée pour la
même opération et des preuves de fiabilité. Cela ne limite pas l'ambition :
c'est la condition pour bâtir une plateforme que les développeurs recommandent.

## Chemin de plateforme

| Étape             | Produit visible                                                                        | Signal de passage                                                         |
| ----------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Fondation         | analyse locale, rapport avec provenance, Vue/Nuxt prouvés                              | des équipes réexécutent les analyses sur leurs dépôts                     |
| Conversion fiable | premier flux rendu nativement, capture web/mobile reproductible, limites signalées     | une preuve visuelle publique et des retours externes corrigent le produit |
| Écosystème        | contrats stables pour adaptateurs et cibles, guides de contribution, benchmark catalog | un contributeur externe ajoute ou maintient une intégration               |
| Distribution      | CLI npm stable, templates, CI et intégrations de build prouvées                        | des équipes l'adoptent sans intervention du fondateur                     |
| Entreprise        | registre privé, politiques de compatibilité, support et gouvernance                    | une même capacité est demandée par plusieurs organisations                |

Le premier contrat ne définit donc pas le plafond de Navirox. Il finance les
deux premières étapes et donne les cas concrets qui rendent les suivantes
crédibles.

## La vérité que l'on peut publier maintenant

| Affirmation             | État                        | Formulation autorisée                                                                                           |
| ----------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Analyse de vrais dépôts | Prouvée                     | « Navirox analyse des dépôts publics à des commits figés et produit un rapport de routes, écrans et blocages. » |
| Baserow Nuxt            | Prouvée dans le benchmark   | « Le benchmark Baserow relève 46 routes et 41 écrans sur la révision documentée. »                              |
| Cal.com et Expo         | Référence sémantique        | « Le benchmark relie des parcours web à une app Expo de référence ; ce n'est pas un test visuel. »              |
| Génération Vue native   | V0 en cours                 | « Un sous-ensemble prudent est compilé ; les cas non sûrs bloquent l'émission. »                                |
| Fidélité visuelle       | Non prouvée globalement     | Ne pas promettre de parité. Renvoi vers `docs/VISUAL-FIDELITY.md`.                                              |
| EAS / Expo              | Intégration future possible | Ne pas dire « intégré à EAS » tant qu'une build reproductible Navirox ne l'établit pas.                         |
| Baserow comme client    | Faux                        | Ne jamais parler de partenariat, de client ou d'application Baserow.                                            |

Cette discipline est une force commerciale : elle permet à un acheteur technique
de vérifier le produit sans découvrir plus tard une promesse exagérée.

## Offre initiale et modèle économique

### Niveau 1 : diagnostic Navirox, open source

Une analyse locale et transparente : structure, routes, composants, limites,
provenance et plan de portage. Elle doit donner une valeur immédiate même sans
contrat. Avant publication npm, ne pas annoncer de commande `npx` publique.

### Niveau 2 : découverte mobile payante

Une semaine courte, à prix fixe, pour :

1. analyser une révision choisie avec le client ;
2. choisir un seul parcours mobile rentable ;
3. vérifier API, identité, données et contraintes native ;
4. remettre un rapport décisionnel, un prototype de flux et un chiffrage de
   réalisation.

Hypothèse de prix à tester : 3 000 à 5 000 EUR HT. Ce n'est pas un tarif de
marché établi. Il est révisé après cinq conversations et les premières ventes.

### Niveau 3 : compagnon mobile livré

Un périmètre borné : deux ou trois parcours tels que consultation, formulaire,
photo, statut, notification ou accès hors connexion. Le client possède ses
accès, ses données et son compte de distribution. Navirox sert à accélérer le
cadrage et les éléments réemployables ; il ne justifie pas une dépendance opaque.

Hypothèse de prix à tester : 12 000 à 20 000 EUR HT pour un prototype de deux
flux, puis un forfait de maintenance de 2 000 à 4 000 EUR HT par mois si la
valeur et la charge le justifient. Ces nombres servent à qualifier une capacité
d'achat, pas à faire une promesse.

## ICP et qualification

| Champ            | Définition initiale                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Secteur          | SaaS B2B, opérations, CRM, données ou back-office avec équipes terrain                        |
| Taille           | 15 à 250 personnes, ou signal de budget comparable                                            |
| Décideur         | CTO, VP Engineering, responsable produit ou fondateur                                         |
| Douleur          | Le web existe, mais un usage téléphone important est lent ou évité                            |
| Déclencheur      | Levée, offre mobile demandée, recrutement mobile, croissance terrain, retours clients répétés |
| Contre-argument  | « Une PWA ou Capacitor suffit »                                                               |
| Signe observable | Stack web maintenue, API, utilisateurs mobiles, absence d'app native claire                   |

Noter 0 à 3 pour le match ICP, le décideur identifié, le déclencheur actif et
la traçabilité du contact. Un score de 9 à 12 est prioritaire, 6 à 8 sert à
apprendre, moins de 6 n'est pas contacté.

### Première cible : Baserow

Baserow est un excellent cas de qualification, non un client présumé : son
frontend Nuxt est déjà un benchmark Navirox et son produit comporte des flux
potentiellement pertinents sur téléphone. La proposition à valider est un
compagnon terrain limité aux données, formulaires, pièces jointes, photos et
notifications, jamais la copie du tableur desktop. Le détail est dans
`docs/pilots/baserow.md`.

Les autres dépôts publics servent à prouver les adaptateurs et à comparer les
flux. Ils ne deviennent des cibles commerciales qu'après une qualification
indépendante : entreprise active, besoin mobile observable, accès à un décideur
et absence de solution native satisfaisante.

La recherche de cibles est détaillée dans
`docs/research/mobile-companion-targets-2026-09.md`. Elle fixe Baserow comme
priorité Vue/Nuxt et SuiteCRM, via son réseau d'intégrateurs, comme priorité
Angular. Les deux pistes visent un compagnon opérationnel, pas une conversion
intégrale d'un outil desktop.

## Boucle de visibilité

Le but n'est pas de publier souvent. Chaque contenu doit soit produire un retour
technique exploitable, soit ouvrir une conversation avec une cible qualifiée.

Pour devenir une marque développeur, chaque preuve doit aussi être réutilisable
par quelqu'un d'autre : dépôt, commit, commande, résultat, limite connue et
issue associée. C'est ce qui peut transformer une démonstration en contribution
plutôt qu'en simple communication.

| Canal                  | Actif à publier                                                       | Action attendue                         | Garde-fou                                               |
| ---------------------- | --------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------- |
| GitHub                 | benchmarks reproductibles, limites explicites, issues bien étiquetées | retours d'intégrateurs et contributeurs | aucun benchmark ne devient une étude de cas sans accord |
| Démonstration courte   | une app web, le rapport, un flux natif et ce qui bloque               | rendez-vous de diagnostic               | montrer aussi l'écart non résolu                        |
| Article technique      | « ce que révèle un audit web vers mobile »                            | conversations avec CTO et développeurs  | pas de listes de clients ou de logos implicites         |
| Communautés Vue / Expo | résultat vérifiable, question technique précise                       | feedback pair à pair                    | aucune prétendue intégration Expo/EAS                   |
| Prospection ciblée     | observation publique + question courte sur un flux mobile             | entretien de qualification              | aucune séquence de masse                                |

Les premiers contenus recommandés sont :

1. le protocole Baserow avec la révision et ses limites ;
2. une vidéo de deux minutes qui oppose un rapport Navirox à un flux mobile
   réellement testé, en annonçant ce qui n'est pas encore fidèle ;
3. un article sur la décision « wrapper web, PWA ou flux natif » ;
4. une page d'offre de découverte, sans promesse d'automatisation totale.

### Machine à contributions

À chaque nouvelle capacité, publier dans cet ordre :

1. un contrat d'adaptateur ou de cible compréhensible ;
2. un fixture minimal qui échoue avant la correction ;
3. un benchmark public à commit épinglé lorsque c'est possible ;
4. une issue qui distingue bug, limitation assumée et besoin de recherche ;
5. un guide de contribution qui indique le test à exécuter et le niveau de
   preuve requis.

Ainsi, Vue, Angular, React, Next ou les futures cibles ne deviennent pas des
cases marketing. Ce sont des surfaces maintenables où la communauté peut créer
de la valeur sans dégrader la promesse de fiabilité.

## Prospection, sans volume inutile

Préparer une liste documentée de 20 comptes, avec URL source et signal de fit,
puis contacter seulement les comptes forts ou moyens. Une séquence comporte au
plus trois touches : une observation réelle et une question courte, une valeur
nouvelle trois jours après, puis une sortie respectueuse sept jours après.

En France et dans l'UE, une sollicitation B2B doit être pertinente pour la
fonction de la personne, identifier clairement l'émetteur et permettre une
opposition simple. Les données collectées doivent rester minimales et leur
source doit être conservée. La [CNIL](https://www.cnil.fr/fr/la-prospection-commerciale-par-courrier-electronique-sms-mms-et-automate-dappel)
décrit ces conditions. Aucune campagne ne doit partir avant la mise en place
d'une identité d'envoi, d'un moyen d'opposition et d'un registre de sources.

Le premier appel ne vend pas une réécriture. Il vérifie : qui souffre du mobile,
quel parcours coûte du temps, quel système expose les données, qui décide et
quel événement rend le sujet urgent.

## Cadence jusqu'au premier encaissement

| Période            | Résultat à obtenir                                                                    | Seuil de décision                                                                |
| ------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 20 au 29 septembre | Offre de découverte, rapport exemple, 15 comptes sourcés et une première démo honnête | Une cible prioritaire choisie avant le 29 septembre                              |
| 1 au 15 octobre    | 10 à 15 prises de contact ciblées et 3 entretiens visés                               | Les objections alimentent le produit et l'offre                                  |
| 16 au 31 octobre   | Proposition de découverte payante sur un flux précis                                  | Si aucun intérêt, revoir ICP et promesse, pas ajouter des frameworks par réflexe |
| 1 au 15 novembre   | Découverte facturée et encaissée, ou mission signée avec paiement daté                | Le premier euro est le critère de succès, pas la visibilité seule                |

Répartition du temps : 60 % conversations, qualification et livraison liée à
une vente ; 30 % preuve technique et fidélité visuelle ; 10 % documentation et
contenu. Ne pas financer de publicité avant d'avoir trouvé un message qui ouvre
des entretiens.

## Indicateurs et décisions

| Signal                                                       | Lecture                                                           | Décision                                                                  |
| ------------------------------------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 20 comptes bien qualifiés, moins de 3 réponses utiles        | Le message ou le segment ne résonne pas                           | Réécrire l'offre après entretiens, pas augmenter le volume                |
| 3 entretiens, même objection répétée                         | Besoin réel ou frein produit identifié                            | L'ajouter au roadmap si cela réduit l'incertitude du premier flux         |
| Demande de diagnostic avec budget                            | Validation commerciale                                            | Proposer une découverte bornée et payante                                 |
| Intérêt pour un wrapper seulement                            | Opportunité de conseil, pas preuve de besoin de génération native | Comparer honnêtement Capacitor et le flux natif                           |
| Aucun signal commercial après 20 comptes et 2 démonstrations | Hypothèse non validée                                             | Stopper l'acquisition large, choisir un vertical ou reprendre la promesse |

## Références externes

- [Capacitor](https://capacitorjs.com/) est la référence à comparer honnêtement :
  il place un runtime natif autour d'une application web existante, y compris
  Vue, plutôt que de produire une interface native indépendante.
- [EAS Build](https://docs.expo.dev/build/introduction/) construit et distribue
  des binaires Expo ou React Native. C'est un canal potentiel de livraison, pas
  une intégration Navirox aujourd'hui.
- [GitHub Sponsors](https://docs.github.com/en/sponsors/getting-started-with-github-sponsors/about-github-sponsors)
  peut soutenir un projet open source, mais ne constitue pas le modèle de revenu
  du premier cycle commercial.
