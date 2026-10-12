import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/Home.vue'

const routes = getRoutes()

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(() => true)
router.addRoute({ path: '/late' })

void HomeView
