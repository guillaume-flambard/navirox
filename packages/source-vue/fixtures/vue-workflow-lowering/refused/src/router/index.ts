import { createRouter, createWebHistory } from 'vue-router'
import RenderFunction from '../views/RenderFunction.vue'
import DynamicComponent from '../views/DynamicComponent.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/render', name: 'render', component: RenderFunction },
    { path: '/dynamic', name: 'dynamic', component: DynamicComponent },
  ],
})
