import { LitElement, html } from 'lit'
import { customElement } from 'lit/decorators.js'

@customElement('x-profile')
export class ProfileView extends LitElement {
  connectedCallback(): void {
    super.connectedCallback()
    navigator.geolocation.getCurrentPosition(() => {})
  }

  render() {
    return html`<p>Profile</p>`
  }
}
