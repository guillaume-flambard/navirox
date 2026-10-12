import { createRouter } from 'vue-router'
import SecondView from '../views/Second.vue'

export default createRouter({ routes: [{ path: '/same', name: 'second', component: SecondView }] })
