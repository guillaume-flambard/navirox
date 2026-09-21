# Cibles pour un compagnon mobile, septembre 2026

**But :** identifier des cas qui servent à la fois la preuve Navirox et une
mission mobile rémunérée. Un dépôt public n'est pas un client acquis.

## Décision

1. **Baserow, Vue/Nuxt, est la meilleure première cible.** La proposition est
   un compagnon terrain, pas la conversion d'une grille desktop.
2. **SuiteCRM, Angular, est le meilleur deuxième axe**, via ses intégrateurs
   qui réalisent déjà du sur-mesure pour des métiers de terrain.
3. Le meilleur segment est le **logiciel B2B opérationnel** : CRM, données,
   inspection, maintenance, logistique, construction ou conformité. Le signal
   décisif est l'usage hors du bureau, avec caméra, scan, statut, signature,
   notification ou réseau dégradé.

## Grille de sélection

| Critère                                        | Poids | Pourquoi                                                 |
| ---------------------------------------------- | ----: | -------------------------------------------------------- |
| Besoin mobile natif observable                 |     3 | Il rend le premier flux facile à vendre et à évaluer.    |
| Stack et API lisibles                          |     2 | Navirox doit apporter une preuve de réemploi concrète.   |
| Activité commerciale et budget                 |     2 | Un bon dépôt ne devient pas automatiquement un acheteur. |
| Absence d'application officielle satisfaisante |     2 | L'offre ne doit pas être un clone tardif.                |
| Parcours bornable                              |     1 | Le premier contrat doit livrer une valeur en semaines.   |

## Cibles classées

| Cible         | Stack observable           |                                Score | Usage recommandé                    | Décision                         |
| ------------- | -------------------------- | -----------------------------------: | ----------------------------------- | -------------------------------- |
| Baserow       | Nuxt/Vue, Django, API REST |                               9,5/10 | Démonstrateur et prospection ciblée | Priorité 1                       |
| SuiteCRM      | Angular, PHP, API          |                               8,5/10 | Intégrateurs et clients métier      | Priorité 2                       |
| Paperless-ngx | Angular, Django            | 8/10 technique, 5/10 prospect direct | Corpus et intégrateurs DMS          | Validation                       |
| OpenProject   | Angular/Rails              |                                 7/10 | Oracle de qualité mobile            | Validation seulement             |
| Directus      | Vue                        |                               6,5/10 | Exemple d'écosystème                | À qualifier                      |
| NocoDB        | Vue                        |                                 4/10 | Contrôle négatif                    | Ne pas pitcher une app générique |
| Taiga         | AngularJS historique       |                               5,5/10 | Corpus ou contenu                   | Pas une priorité de revenu       |

## Baserow, priorité Vue/Nuxt

Le dépôt documente un frontend Nuxt/Vue séparé d'un backend Django et d'une API
REST. Baserow a annoncé une seed de 5 M EUR et commercialise une offre
Enterprise. En février 2026, son équipe a confirmé dans le forum ne pas avoir de
plan concret pour une application mobile, le sujet ayant été dépriorisé.

- Source technique : [architecture Baserow](https://github.com/baserow/baserow/blob/develop/docs/technical/introduction.md).
- Source activité : [seed](https://baserow.io/blog/announcing-Baserow-5m-seed-round)
  et [offre Enterprise](https://baserow.io/user-docs/enterprise-license-overview).
- Source besoin mobile : [réponse officielle](https://community.baserow.io/t/install-baserow-on-a-cell-phone/5668).

**Angle :** consulter ou modifier une fiche, joindre une photo, remplir un
formulaire, scanner, recevoir une notification et continuer avec un réseau
dégradé. Les intégrateurs et entreprises qui opèrent sur Baserow sont des
acheteurs potentiellement plus accessibles que l'éditeur lui-même.

## SuiteCRM, priorité Angular

SuiteCRM 8 expose un frontend Angular dans sa structure d'extensions. L'éditeur
vend publiquement support, intégration et développement sur mesure, ce qui rend
son réseau d'intégrateurs plus intéressant qu'un pitch frontal pour refaire le
CRM entier.

- Source technique : [structure d'extensions](https://docs.suitecrm.com/8.x/developer/extensions/extension-structure/)
  et [configuration Angular](https://github.com/SuiteCRM/SuiteCRM-Core/blob/hotfix/extensions/defaultExt/app/angular.json).
- Source activité : [tarifs](https://suitecrm.com/pricing/) et
  [services](https://suitecrm.com/services/).

**Angle :** application white-label pour commerciaux, techniciens ou
distributeurs : fiche client, visite, photo, scan, compte-rendu, signature et
synchronisation. L'absence d'app officielle n'est pas affirmée sans vérification
par intégrateur et client.

## Paperless-ngx, preuve Angular et acheteur indirect

Paperless-ngx associe Django et Angular pour scanner, indexer et archiver des
documents. Sa documentation dirige vers une liste de clients mobiles maintenue
par la communauté, et un mainteneur explique que le projet central ne construit
pas l'app mobile.

- Source technique : [dépôt Paperless-ngx](https://github.com/paperless-ngx/paperless-ngx).
- Source mobile : [documentation](https://github.com/paperless-ngx/paperless-ngx/blob/dev/docs/usage.md)
  et [discussion mainteneur](https://github.com/paperless-ngx/paperless-ngx/discussions/13059).

**Usage :** scénario solide de caméra, capture, OCR et offline. Viser un MSP ou
un intégrateur DMS, pas le projet central, en première intention.

## Exclusions utiles

- [OpenProject dispose déjà d'une app officielle](https://www.openproject.org/docs/mobile-app-guide/).
  C'est un oracle de parcours mobile, pas une cible de remplacement général.
- [NocoDB affirme que ses interfaces publiées fonctionnent sur mobile](https://nocodb.com/docs/interfaces).
  Il ne faut pas le démarcher pour une app générique.

## ICP opérationnel

Une entreprise à prospecter cumule :

1. un outil web maintenu, Vue/Nuxt ou Angular pour les premiers adaptateurs ;
2. une API exploitable et une authentification dont le propriétaire est connu ;
3. des utilisateurs hors du bureau ;
4. un flux téléphone fréquent et coûteux sans application native satisfaisante ;
5. un décideur capable d'acheter une découverte de cinq jours ;
6. au plus trois parcours pour le premier périmètre.

**Question de qualification :** « Sur quel geste vos équipes terrain sortent
leur téléphone, mais trouvent votre interface web trop lente, trop fragile ou
trop pénible ? » Sans geste concret, il n'y a pas encore de mission à vendre.
