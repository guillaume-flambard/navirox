import { createRouter, createWebHistory } from 'vue-router'
import WatchedView from '../views/Watched.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', name: 'watched', component: WatchedView }],
})
