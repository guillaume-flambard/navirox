import { Profile } from './views/Profile'

export const routes = [
  { path: '/', component: Profile },
  { path: '/profile', component: Profile },
  { path: '/rows/:id', component: Profile },
]
