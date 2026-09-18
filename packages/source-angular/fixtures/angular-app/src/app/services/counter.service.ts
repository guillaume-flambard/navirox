import { Injectable, signal } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class CounterService {
  readonly count = signal(0)

  increment(): void {
    this.count.update((value) => value + 1)
  }
}
