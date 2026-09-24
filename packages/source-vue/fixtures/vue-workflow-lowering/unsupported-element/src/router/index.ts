import { createRouter, createWebHistory } from 'vue-router'
import CustomWidget from '../views/CustomWidget.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', name: 'custom-widget', component: CustomWidget }],
})
