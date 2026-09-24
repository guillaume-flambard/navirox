import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/Home.vue'
import AboutView from './views/About.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/about', name: 'about', component: AboutView },
  ],
})

createApp({ template: '<router-view />' }).use(router).mount('#app')
