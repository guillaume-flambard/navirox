import { createRouter, createWebHistory } from 'vue-router'

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/account/:accountId',
      children: [{ path: 'settings' }, { path: 'billing/:invoiceId' }],
    },
  ],
})
