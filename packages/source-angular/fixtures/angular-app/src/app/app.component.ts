import { Component } from '@angular/core'

@Component({
  selector: 'app-root',
  standalone: true,
  template: '<h1>{{ visits }} visits</h1>',
})
export class AppComponent {
  readonly visits = readVisits()
}

function readVisits(): number {
  const saved = localStorage.getItem('visits')
  localStorage.setItem('visits', String(Number(saved ?? '0') + 1))
  return Number(saved ?? '0')
}
