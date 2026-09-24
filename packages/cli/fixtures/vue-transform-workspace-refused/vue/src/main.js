import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/Home.vue'
import RefusedView from './views/Refused.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/refused', name: 'refused', component: RefusedView },
  ],
})

createApp({ template: '<router-view />' }).use(router).mount('#app')
