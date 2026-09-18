import { Component } from '@angular/core'

@Component({
  selector: 'app-profile',
  standalone: true,
  template: '<button (click)="locate()">Locate me</button>',
})
export class ProfileComponent {
  locate(): void {
    navigator.geolocation.getCurrentPosition((position) => {
      console.log(position.coords.latitude)
    })
  }
}
