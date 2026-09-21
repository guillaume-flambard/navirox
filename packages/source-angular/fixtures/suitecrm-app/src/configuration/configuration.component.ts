import { Component } from '@angular/core'

@Component({
  selector: 'app-configuration',
  standalone: true,
  template:
    '<table><tr *ngFor="let setting of settings"><td>{{ setting.key }}</td><td>{{ setting.value }}</td></tr></table>',
})
export class ConfigurationComponent {
  readonly settings = [
    { key: 'currency', value: 'EUR' },
    { key: 'timezone', value: 'Europe/Paris' },
  ]
}
