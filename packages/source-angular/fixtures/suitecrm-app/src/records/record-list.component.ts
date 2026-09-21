import { Component } from '@angular/core'

@Component({
  selector: 'app-record-list',
  standalone: true,
  template: '<ul><li *ngFor="let record of records">{{ record }}</li></ul>',
})
export class RecordListComponent {
  readonly records = ['Acme', 'Globex']
}
