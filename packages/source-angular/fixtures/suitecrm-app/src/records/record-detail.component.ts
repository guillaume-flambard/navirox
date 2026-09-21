import { Component } from '@angular/core'

@Component({
  selector: 'app-record-detail',
  standalone: true,
  template:
    '<section><h2>{{ name }}</h2><button (click)="scanDocument()">Scan a document</button></section>',
})
export class RecordDetailComponent {
  name = 'Acme'

  async scanDocument(): Promise<void> {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })

    stream.getTracks().forEach((track) => {
      track.stop()
    })
  }
}
