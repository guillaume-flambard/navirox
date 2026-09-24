import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/Home.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', name: 'home', component: HomeView }],
})
