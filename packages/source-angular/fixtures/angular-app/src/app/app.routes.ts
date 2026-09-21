import type { Routes } from '@angular/router'
import { AppComponent } from './app.component'

export const routes: Routes = [
  { path: '', component: AppComponent },
  { path: 'about', component: AboutComponent },
  { path: 'blog/:slug', component: BlogComponent },
  {
    path: 'profile',
    loadComponent: () =>
      import('./views/profile.component').then((module) => module.ProfileComponent),
  },
]
