import { Component } from '@angular/core'

@Component({
  selector: 'app-portal-cases',
  standalone: true,
  template: '<ul><li *ngFor="let item of cases">{{ item }}</li></ul>',
})
export class PortalCasesComponent {
  readonly cases: readonly string[] = []
}
