import { createRouter, createWebHistory } from 'vue-router'
import RawHtml from '../views/RawHtml.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', name: 'raw-html', component: RawHtml }],
})
