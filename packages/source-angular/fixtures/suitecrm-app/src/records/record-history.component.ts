import { Component } from '@angular/core'

@Component({
  selector: 'app-record-history',
  standalone: true,
  templateUrl: './record-history.component.html',
})
export class RecordHistoryComponent {
  readonly entries: readonly string[] = []
}
