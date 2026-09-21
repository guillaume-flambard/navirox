import type { Routes } from '@angular/router'
import { RecordAttachmentsComponent } from './record-attachments.component'
import { RecordDetailComponent } from './record-detail.component'
import { RecordHistoryComponent } from './record-history.component'
import { RecordUpdateFormComponent } from './record-update-form.component'

export const recordsRoutes: Routes = [
  { path: 'records/:id', component: RecordDetailComponent },
  { path: 'records/:id/edit', component: RecordUpdateFormComponent },
  { path: 'records/:id/attachments', component: RecordAttachmentsComponent },
  { path: 'records/:id/history', component: RecordHistoryComponent },
]
