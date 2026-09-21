import { Component } from '@angular/core'

@Component({
  selector: 'app-record-update-form',
  standalone: true,
  template:
    '<form (submit)="save()"><input [value]="name" (input)="onInput($event)" /><button type="submit">Save</button></form>',
})
export class RecordUpdateFormComponent {
  name = ''

  onInput(event: Event): void {
    this.name = (event.target as HTMLInputElement).value
  }

  async save(): Promise<void> {
    await fetch('/api/records/current', {
      method: 'PATCH',
      body: JSON.stringify({ name: this.name }),
    })
  }
}
