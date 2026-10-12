import { createRouter, createWebHistory } from 'vue-router'
import ParametersView from '../views/Parameters.vue'
import MultipleView from '../views/Multiple.vue'
import ModifierView from '../views/Modifier.vue'
import EffectView from '../views/Effect.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/parameters', component: ParametersView },
    { path: '/multiple', component: MultipleView },
    { path: '/modifier', component: ModifierView },
    { path: '/effect', component: EffectView },
  ],
})
