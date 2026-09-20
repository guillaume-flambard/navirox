import { createRouter, createWebHistory } from 'vue-router'
import ProfileView from '../views/Profile.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: ProfileView },
    { path: '/profile/:id', name: 'profile', component: () => import('../views/Profile.vue') },
  ],
})
