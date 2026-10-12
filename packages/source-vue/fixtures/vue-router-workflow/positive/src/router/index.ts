import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/Home.vue'
import ProfileView from '../views/Profile.vue'
import SettingsView from '../views/Settings.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/profile/:id', name: 'profile', component: ProfileView },
    { path: '/settings', name: 'settings', component: SettingsView },
  ],
})
