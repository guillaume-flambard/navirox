import { createRouter } from 'vue-router'
import FirstView from '../views/First.vue'

export default createRouter({ routes: [{ path: '/same', name: 'first', component: FirstView }] })
