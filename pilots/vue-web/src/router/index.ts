import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/favourites',
      name: 'favourites',
      // lazy-loaded: separate chunk, fetched when the route is visited
      component: () => import('../views/FavouritesView.vue'),
    },
    {
      path: '/product/:id',
      name: 'product',
      // route level code-splitting with a dynamic param
      component: () => import('../views/ProductView.vue'),
      props: true,
    },
  ],
})

export default router
