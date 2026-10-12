import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/Home.vue'
import MissingView from '../views/Missing.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/missing', component: MissingView },
  ],
})
