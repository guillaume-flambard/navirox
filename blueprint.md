# Blueprint — Native Mobile Stack for Vue Teams

## 1. Nouvelle définition du produit

Le produit n'est plus :

> Vue → Expo

Le produit devient :

> **La stack mobile native pour les équipes Vue et Nuxt.**

Promesse centrale :

> **Build native iOS and Android apps without leaving Vue.**

Ou :

> **Your Vue stack. Now native.**

Le développeur ne doit pas avoir à devenir développeur React Native.

Il doit pouvoir conserver :

- Vue 3
- Composition API
- `<script setup>`
- Pinia
- TypeScript
- ses types
- ses clients API
- ses validations
- ses composables compatibles
- une partie de sa logique métier

et construire une application réellement native.

---

# 2. Le problème utilisateur

Une équipe possède aujourd'hui :

```text
Nuxt / Vue application
        │
        ├── Vue components
        ├── Pinia
        ├── composables
        ├── API client
        ├── TypeScript types
        ├── validation
        └── business logic
```

Puis arrive le besoin :

> Nous voulons une application iOS et Android.

Les choix habituels sont :

```text
A. React Native
   → nouvelle stack
   → React
   → nouvelle expertise

B. Flutter
   → Dart
   → réécriture importante

C. Capacitor
   → WebView
   → compromis sur l'UI native

D. NativeScript
   → autre écosystème mobile
```

Notre réponse :

```text
Keep Vue.

Add native mobile.
```

---

# 3. Le produit vu par l'utilisateur

Installation :

```bash
npm create <project-name>
```

ou sur un projet existant :

```bash
npx <project-name> init
```

Puis :

```bash
<project-name> dev
```

Et l'utilisateur développe :

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useHaptics } from '@project/native'

const count = ref(0)
const haptics = useHaptics()

function increment() {
  count.value++
  haptics.selection()
}
</script>

<template>
  <Screen>
    <Text>{{ count }}</Text>

    <Pressable @press="increment">
      <Text>Increment</Text>
    </Pressable>
  </Screen>
</template>
```

Le résultat est une application native :

```text
iOS
Android
```

---

# 4. Principe architectural

Notre produit ne doit jamais dépendre stratégiquement d'un seul runtime.

Architecture :

```text
                         APP VUE

                            │
                            ▼

                 ┌───────────────────┐
                 │   NOTRE PLATFORM  │
                 │                   │
                 │ DX Vue            │
                 │ CLI               │
                 │ Router            │
                 │ Native APIs       │
                 │ Compatibility     │
                 │ Migration         │
                 │ Tooling           │
                 └─────────┬─────────┘
                           │
                           ▼

                  RUNTIME ADAPTER

                actuellement possible :
                       Symbiote

                           │
                           ▼
                    React Native
                       Fabric

                           │
                     ┌─────┴─────┐
                     ▼           ▼
                    iOS       Android
```

Expo peut être utilisé au niveau infrastructure :

```text
Expo modules
Expo Dev Client
EAS Build
EAS Update
EAS Submit
```

mais Expo n'est pas notre identité.

---

# 5. Principe fondamental

> **Symbiote est une implémentation. Vue mobile est notre produit.**

Si demain :

```text
Symbiote disparaît
```

nous devons pouvoir remplacer :

```text
runtime adapter
```

sans changer :

- CLI
- routing
- API publique
- migration tools
- compatibility database
- docs
- ecosystem
- developer experience

---

# 6. Les 5 piliers du produit

Le produit repose sur cinq piliers.

## Pillar 1 — Create

Créer une application mobile native Vue.

```bash
npm create <name>
```

Résultat :

```text
my-app/
├── app/
├── components/
├── stores/
├── composables/
├── native/
├── project.config.ts
└── package.json
```

---

## Pillar 2 — Develop

Une expérience Vue normale.

Support :

```text
.vue
<script setup>
ref()
computed()
watch()
props
emits
slots
Pinia
TypeScript
```

Le développeur doit oublier autant que possible :

```text
Fabric
JSI
nativeFabricUIManager
React reconciler
Symbiote
```

---

## Pillar 3 — Native

Accès simple aux capacités mobiles.

API cible :

```ts
import {
  useCamera,
  useLocation,
  useHaptics,
  useNotifications,
  useSecureStorage
} from '@project/native'
```

Exemple :

```ts
const camera = useCamera()

await camera.requestPermission()
```

Notre API reste Vue-first même si elle utilise dessous :

```text
Expo module
React Native library
native implementation
```

---

## Pillar 4 — Migrate

Transformer progressivement une base Vue/Nuxt en application mobile.

Commande :

```bash
<project> inspect
```

Retour :

```text
Native readiness report

Components analysed       213

Portable                   121
Adaptable                   54
Native rewrite required     38

Pinia stores               18/18 compatible
API modules                12/12 compatible
Composables                41/49 compatible
```

Puis :

```bash
<project> migrate
```

pour automatiser les transformations simples.

---

## Pillar 5 — Ship

Construire et publier facilement.

Backends possibles :

```text
Expo / EAS
native Xcode
native Gradle
future providers
```

UX :

```bash
<project> build ios
<project> build android
<project> update
<project> submit
```

En V1, ces commandes peuvent simplement orchestrer EAS.

---

# 7. La killer feature

Le vrai message différenciant n'est pas :

> Vue peut afficher un `<View>` natif.

C'est :

> **Une équipe Vue peut ajouter le mobile sans changer complètement de stack.**

Exemple :

```text
                      SHARED

                 TypeScript types
                 API client
                 validation
                 business rules
                 Pinia stores
                 composables

                ┌───────┴───────┐
                ▼               ▼

            Nuxt Web        Native App

              Vue              Vue
```

---

# 8. Structure recommandée d'un projet

À terme :

```text
my-product/
│
├── apps/
│   ├── web/
│   │   └── Nuxt
│   │
│   └── mobile/
│       └── <our platform>
│
└── packages/
    ├── api/
    ├── stores/
    ├── types/
    ├── validation/
    └── business/
```

Le discours n'est donc pas :

> partagez 100 % de votre UI.

Ce serait irréaliste.

Mais :

> **Partagez tout ce qui a du sens, et réécrivez seulement la couche réellement native.**

---

# 9. Trois catégories de code

L'outil doit explicitement reconnaître trois catégories.

## A — Shared

Exemple :

```ts
export interface User {}

export const useAuthStore = defineStore(...)

export async function getUser() {}
```

Même code sur web et mobile.

---

## B — Adaptable

Exemple web :

```ts
localStorage.setItem()
```

devient :

```ts
nativeStorage.set()
```

L'outil peut aider à adapter automatiquement.

---

## C — Platform-specific

Exemple :

```text
Leaflet map
```

devient :

```text
native maps component
```

On ne promet pas de magie.

---

# 10. Le CLI

C'est l'une des parties centrales du produit.

```bash
<project> create
<project> dev
<project> inspect
<project> doctor
<project> migrate
<project> build
<project> update
<project> submit
```

---

# 11. `doctor`

Très important.

```bash
<project> doctor
```

Résultat :

```text
Environment

Vue                 3.6          ✅
Runtime             x.x          ✅
React Native        x.x          ✅
Expo SDK            x.x          ✅
iOS                 26           ✅
Android API         xx           ✅

Dependencies

Pinia                            ✅
VueUse                           🟡 82%
expo-haptics                     ✅
expo-camera                      ✅
react-native-reanimated          🟡
leaflet                          ❌

3 compatibility issues detected.
```

Ce système peut devenir un véritable moat.

---

# 12. Compatibility Registry

Créer un registry structuré.

Exemple :

```json
{
  "expo-camera": {
    "support": "full",
    "adapter": "@project/camera",
    "tested": {
      "ios": true,
      "android": true
    }
  }
}
```

À terme :

```text
registry/<package>/<version>
```

permet de connaître les combinaisons compatibles.

---

# 13. Compatibility CI

Chaque release doit tester une matrice.

```text
Vue versions
×
runtime versions
×
RN versions
×
Expo SDK versions
×
iOS
×
Android
```

C'est très important stratégiquement.

Ton code peut être forké.

Une énorme infrastructure de compatibilité entretenue sur plusieurs années est beaucoup plus difficile à reproduire.

---

# 14. Native API layer

Ne pas exposer directement toutes les complexités des providers.

Utilisateur :

```ts
import { useLocation } from '@project/native'
```

Notre implementation :

```text
useLocation()
     │
     ├── Expo Location adapter
     ├── RN library adapter
     └── future native adapter
```

Cela évite une dépendance structurelle trop forte à Expo.

---

# 15. Provider model

Architecture :

```text
@project/native
      │
      ▼
 provider API
      │
 ┌────┼─────┐
 ▼    ▼     ▼
Expo  RN   Custom
```

Configuration :

```ts
export default defineConfig({
  nativeProvider: 'expo'
})
```

À terme éventuellement :

```ts
nativeProvider: 'bare'
```

---

# 16. Routing

Créer une vraie expérience Vue.

Par exemple :

```text
app/
├── index.vue
├── settings.vue
├── profile/
│   └── [id].vue
└── _layout.vue
```

Puis :

```ts
const router = useRouter()

router.push('/settings')
```

Le backend de navigation peut utiliser :

```text
react-native-screens
native navigation
other provider
```

Mais l'API publique nous appartient.

---

# 17. Layout

Exemple :

```vue
<template>
  <Stack>
    <Slot />
  </Stack>
</template>
```

Cela donne une expérience proche de Nuxt/Expo Router sans dépendre de React.

---

# 18. Native components

Nous devons définir notre propre surface stable :

```text
View
Text
Image
Pressable
ScrollView
TextInput
FlatList
Modal
SafeAreaView
KeyboardAvoidingView
```

Ils peuvent initialement être des exports/re-exports du runtime sous-jacent.

Mais les utilisateurs importent idéalement depuis :

```ts
@project/ui
```

et non directement de Symbiote.

Pourquoi ?

Parce que :

```text
notre API
    ↓
adapter
    ↓
Symbiote
```

peut changer plus tard.

---

# 19. Styling

V1 :

```vue
<View :style="{ flex: 1 }">
```

Puis :

```ts
StyleSheet.create()
```

V2 :

```vue
<View class="flex-1 items-center justify-center">
```

Idéalement une solution basée sur :

```text
UnoCSS
```

car elle correspond naturellement à Vue.

---

# 20. Pinia

Support officiel.

Starter :

```ts
import { createPinia } from 'pinia'

app.use(createPinia())
```

La compatibilité Pinia doit être quasiment considérée comme une feature core.

---

# 21. VueUse

Très intéressant stratégiquement.

Créer une compatibility matrix :

```text
useFetch               ✅
useDebounce            ✅
useStorage             adapter
useWindowSize          adapter
useMouse               ❌
useGeolocation         native implementation
```

Et éventuellement :

```text
@project/vueuse
```

avec substitutions native-aware.

---

# 22. Nuxt Migration

Pas V0.

Mais grosse direction stratégique.

Commande :

```bash
<project> inspect ./my-nuxt-app
```

Détection :

```text
Nuxt
Vue
Pinia
Vue Router
VueUse
Tailwind
i18n
API clients
browser APIs
DOM-specific components
```

---

# 23. Migration mapping

Exemple :

```text
WEB                        MOBILE

localStorage         →     storage
navigator.geolocation →    native location
<input file>         →     native picker
window.location      →     router
Leaflet              →     native maps
CSS hover            →     remove/adapt
```

Cette connaissance accumulée peut devenir très précieuse.

---

# 24. Migration assistant

À terme :

```bash
<project> migrate src/
```

peut :

```text
localStorage
     ↓
import { storage } from '@project/native'
```

et produire les TODO pour les migrations impossibles à automatiser.

---

# 25. DevTools

Objectif :

```text
Vue DevTools
```

pour une application native.

Inspecter :

```text
components
props
refs
computed
Pinia
events
```

Si possible, cela devient une grosse feature différenciante.

---

# 26. Expo

Expo devient une integration majeure.

Pas la marque.

Exemple docs :

```text
Integrations

✓ Expo
✓ EAS
```

Support :

```text
Expo Modules
Expo Dev Client
Expo Config Plugins
EAS Build
EAS Update
EAS Submit
```

---

# 27. Symbiote

Symbiote devient :

```text
Runtime Provider
```

Il peut être une dependency importante sans devenir notre identité.

Structure :

```text
packages/
├── core/
├── cli/
├── router/
├── ui/
├── native/
├── doctor/
├── migrate/
│
└── runtime-symbiote/
```

Très important :

```text
runtime-symbiote/
```

et pas :

```text
tout le framework profondément couplé à Symbiote
```

---

# 28. Runtime interface

Créer très tôt une abstraction interne.

Conceptuellement :

```ts
interface NativeRuntime {
  mount(app: VueComponent): void

  components: {
    View: NativeComponent
    Text: NativeComponent
    Pressable: NativeComponent
  }

  registerNativeComponent(): void
}
```

Puis :

```text
runtime-symbiote
```

implémente cette interface.

Cela nous donne une sortie future.

---

# 29. MVP réel

Le MVP n'est plus :

> Vue + Expo.

Le MVP devient :

> **Créer une vraie application mobile Vue avec une DX cohérente.**

Definition of Done :

```text
[ ] npm create <name>
[ ] App.vue
[ ] Vue 3 reactivity
[ ] native View/Text/Pressable
[ ] iOS
[ ] Android
[ ] Pinia
[ ] native module example
[ ] CLI dev
[ ] Fast Refresh
```

Et si Expo fonctionne :

```text
[ ] Expo Dev Client
[ ] EAS Build
```

énorme bonus pour le lancement.

---

# 30. MVP 0.1

Inclure :

```text
Vue 3
SFC
TypeScript
Pinia
View
Text
Pressable
Image
ScrollView
TextInput
native haptics
native storage
iOS
Android
CLI
doctor
```

---

# 31. 0.2

```text
routing
layouts
location
camera
image picker
permissions
Expo integration
EAS
```

---

# 32. 0.3

```text
compatibility registry
VueUse adapters
notifications
deep links
styling DX
```

---

# 33. 0.4

```text
Nuxt inspect
migration report
migration codemods
```

---

# 34. 1.0

Le projet devient :

> une stack mobile Vue raisonnablement utilisable en production.

Avec :

```text
stable API
stable routing
stable native layer
build/update story
compatibility guarantees
migration tooling
docs
examples
CI matrix
```

---

# 35. Positionnement concurrence

## NativeScript-Vue

Ils disent :

```text
Vue on NativeScript
```

Nous :

```text
mobile stack for existing Vue/Nuxt teams
+
RN/Expo ecosystem
+
migration tooling
```

---

## Capacitor

Capacitor :

```text
web app inside native shell
```

Nous :

```text
native UI
```

---

## Symbiote

Symbiote :

```text
multi-framework renderer for RN Fabric
```

Nous :

```text
complete Vue-native developer platform
```

---

## Vue Native-like runtimes

Eux :

```text
Vue → native rendering
```

Nous :

```text
create
develop
migrate
ship
maintain
```

Le renderer n'est qu'une brique.

---

# 36. Positionnement simple

Phrase courte :

> **The native mobile stack for Vue teams.**

Sous-titre :

> Build real iOS and Android apps with Vue 3 while keeping your existing Vue skills, stores, types and business logic.

---

# 37. Positionnement pour une entreprise

Pas :

> Nous avons développé un custom renderer Vue.

Mais :

> **Vous avez déjà une équipe Vue. Vous n'avez pas besoin de recruter une seconde équipe React Native pour lancer votre application mobile.**

Ça vend beaucoup mieux.

---

# 38. Positionnement pour développeur

> You know Vue. That's enough.

Puis :

```bash
npm create <name>
```

---

# 39. Open source

Le cœur :

```text
CLI
runtime adapter
router
components
native APIs
doctor
basic migration tooling
```

reste OSS.

Licence probablement permissive type MIT/Apache, à confirmer après revue des dépendances.

---

# 40. Monétisation future

Le framework n'est pas nécessairement le produit payant.

## Enterprise support

```text
priority issues
migration assistance
upgrade assistance
compatibility SLA
```

---

## Migration Cloud

Analyse de gros repos privés.

```text
native readiness
dependency compatibility
migration plans
codemods
```

---

## Compatibility Cloud

```text
private dependency scans
CI checks
upgrade reports
version compatibility
```

---

## Consulting

```text
Nuxt → native migration
architecture
custom adapters
```

---

# 41. Le moat

Pas le code.

Le moat devient :

```text
brand
+
community
+
Vue-native API
+
compatibility registry
+
CI matrix
+
migration knowledge
+
adapters
+
documentation
+
real production applications
```

---

# 42. Test anti-Symbiote

Pour chaque feature, poser :

> Si Symbiote implémente ça demain, est-ce que notre projet reste utile ?

Exemple :

### Expo module support

Symbiote l'implémente.

Notre projet reste utile ?

Si notre seule feature est ça :

```text
❌ non
```

---

### Nuxt migration tooling

Symbiote l'implémente ?

Probablement pas son rôle.

```text
✅ notre produit reste utile
```

---

### Vue-specific routing

Symbiote peut en faire un.

Mais notre produit possède encore :

```text
CLI
migration
compatibility
DX
ecosystem
```

```text
✅ oui
```

---

# 43. Test anti-fork

Question :

> Peut-on remplacer notre projet avec un fork fait en une semaine ?

Au début :

```text
oui
```

Normal.

À terme :

```text
runtime code                   easy
CLI                            medium
router                         medium
50 adapters                    hard
compat registry                hard
Nuxt migration knowledge       very hard
community                      very hard
brand                          very hard
production track record        very hard
```

C'est ce qu'on veut construire.

---

# 44. Ce qu'on ne doit pas faire

Ne pas devenir :

```text
Symbiote wrapper
```

Ne pas devenir :

```text
Expo Metro patch
```

Ne pas devenir :

```text
collection de Vue wrappers
```

Ne pas promettre :

```text
100% Nuxt code runs natively
```

Ne pas réimplémenter :

```text
React Native
Fabric
Expo Build infra
```

---

# 45. Première release publique

La démo idéale :

Écran gauche :

```text
Nuxt/Vue developer
```

Éditeur :

```vue
<script setup>
const count = ref(0)
</script>

<template>
  <Screen>
    <Text>{{ count }}</Text>
    <Button @press="count++" />
  </Screen>
</template>
```

Écran droit :

```text
iPhone simulator
```

Save.

UI update.

Puis :

```text
"This is not a WebView."
```

Puis :

```text
"Vue 3. Native iOS & Android."
```

Très partageable.

---

# 46. Première semaine

## Day 1

Créer repo.

```text
monorepo
packages/runtime
packages/runtime-symbiote
apps/playground
```

Faire :

```text
App.vue → iOS
```

---

## Day 2

Android.

```text
App.vue → Android
```

Events + reactivity.

---

## Day 3

API publique minimale.

```ts
createNativeApp(App)
```

et composants importés depuis notre package.

---

## Day 4

Pinia + HMR.

---

## Day 5

Première native API :

```text
haptics
storage
```

---

## Day 6

CLI :

```bash
npm create <name>
```

---

## Day 7

README + démo + documentation architecture + release `0.0.1`.

Expo/EAS peut être développé parallèlement si les expérimentations passent rapidement.

---

# 47. Ce qu'il faut prouver avant toute grosse roadmap

Trois choses.

## Proof A

```text
Vue SFC
↓
native iOS/Android
```

avec une bonne DX.

---

## Proof B

Nous pouvons définir notre API au-dessus de Symbiote sans exposer Symbiote partout.

---

## Proof C

Nous pouvons utiliser suffisamment de l'écosystème Expo/RN pour que notre différenciation face à NativeScript soit réelle.

---

# 48. North Star à 12 mois

Un développeur avec :

```text
Nuxt
Pinia
Vue
```

doit pouvoir faire :

```bash
npx <name> init
```

et obtenir :

```text
✓ Existing Nuxt project detected
✓ Pinia detected
✓ Shared types detected
✓ 42 compatible composables
✓ Mobile project created
```

Puis :

```bash
<name> dev
```

et développer son application native.

---

# 49. Vision longue

À terme, le projet pourrait devenir :

```text
                    Vue ecosystem
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
       Web             Mobile          Desktop
       Nuxt          <project>        future
```

Notre domaine est initialement :

```text
Mobile
```

Pas besoin d'élargir trop tôt.

---

# 50. La définition finale

Le projet n'est pas :

> un adapter Vue vers Expo.

Il n'est pas non plus :

> un renderer Vue supplémentaire.

Il est :

> **la couche produit qui transforme l'écosystème Vue en une véritable stack de développement mobile native.**

Architecture :

```text
Vue developer
      │
      ▼
OUR PLATFORM
      │
      ├── Create
      ├── Develop
      ├── Native APIs
      ├── Router
      ├── Doctor
      ├── Compatibility
      ├── Migrate
      └── Ship
      │
      ▼
runtime provider
      │
      ▼
React Native Fabric
      │
      ▼
iOS / Android

        +

Expo / EAS integrations
```

## Mission

> **Make mobile a first-class platform for Vue teams.**

## Test stratégique

Si demain Symbiote devient parfait :

> notre produit doit devenir meilleur, pas inutile.

Si demain Expo ajoute officiellement Vue :

> notre produit doit pouvoir profiter de cette intégration, pas disparaître.

Si demain un nouveau renderer Vue apparaît :

> nous devons pouvoir l'adopter.

Le moteur peut changer.

**Le produit, la communauté, les APIs, la compatibilité et la migration restent à nous.**