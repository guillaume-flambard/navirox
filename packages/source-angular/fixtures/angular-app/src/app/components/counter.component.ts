import { Component, signal } from '@angular/core'

@Component({
  selector: 'app-counter',
  standalone: true,
  template: '<button (click)="increment()">{{ count() * 2 }}</button>',
})
export class CounterComponent {
  readonly count = signal(0)

  increment(): void {
    this.count.update((value) => value + 1)
  }
}
