import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { ConfigurationComponent } from '../configuration/configuration.component'
import { RecordListComponent } from '../records/record-list.component'

const routes: Routes = [
  { path: '', component: RecordListComponent },
  { path: 'admin/configuration', component: ConfigurationComponent },
]

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
