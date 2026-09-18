import type { Routes } from '@angular/router'

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'admin',
    children: [{ path: 'users', component: UsersComponent }],
  },
  {
    path: 'reports',
    loadChildren: () => import('./reports/reports.routes').then((m) => m.routes),
  },
]
