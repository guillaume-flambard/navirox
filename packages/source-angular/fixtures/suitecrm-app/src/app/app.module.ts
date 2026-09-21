import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { AppRoutingModule } from './app-routing.module'
import { RecordListComponent } from '../records/record-list.component'

@NgModule({
  imports: [BrowserModule, AppRoutingModule, RecordListComponent],
  bootstrap: [],
})
export class AppModule {}
