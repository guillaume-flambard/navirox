import { createRouter, createWebHistory } from 'vue-router'
import MacroScreen from '../views/MacroScreen.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', name: 'macro-screen', component: MacroScreen }],
})
