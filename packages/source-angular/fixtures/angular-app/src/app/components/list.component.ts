import { Component } from '@angular/core'
import { RowsService } from '../services/rows.service'

@Component({
  selector: 'app-list',
  standalone: true,
  template: '<li *ngFor="let row of rows">{{ row }}</li>',
})
export class ListComponent {
  readonly rows = new RowsService().rows
}
