import type { Routes } from '@angular/router'
import { PortalCasesComponent } from './portal-cases.component'

const base = 'portal'

export const dynamicRoutes: Routes = [{ path: `${base}/cases`, component: PortalCasesComponent }]
