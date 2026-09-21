import { Component } from '@angular/core'

@Component({
  selector: 'app-record-attachments',
  standalone: true,
  template: '<label>Attachment<input type="file" (change)="onFile($event)" /></label>',
})
export class RecordAttachmentsComponent {
  fileName = ''

  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0]

    if (file === undefined) {
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      this.fileName = file.name
    }
    reader.readAsDataURL(file)
  }
}
