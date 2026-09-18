import type { Routes } from '@angular/router'

export const routes: Routes = [
  { path: '', component: AppComponent },
  { path: 'about', component: AboutComponent },
  { path: 'blog/:slug', component: BlogComponent },
]
