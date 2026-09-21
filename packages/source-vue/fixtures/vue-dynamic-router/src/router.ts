import { createRouter, createWebHistory } from 'vue-router'

const baseRoutes = [{ path: '/account' }]
const routes = [...baseRoutes]

export default createRouter({
  history: createWebHistory(),
  routes,
})
