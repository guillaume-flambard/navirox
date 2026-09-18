import { Component } from '@angular/core'

@Component({
  selector: 'app-name-input',
  standalone: true,
  template: '<input [value]="name" (input)="onInput($event)" />',
})
export class NameInputComponent {
  name = ''

  onInput(event: Event): void {
    this.name = (event.target as HTMLInputElement).value
  }

  get valid(): boolean {
    return this.name.trim().length > 0
  }
}
