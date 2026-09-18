import { LitElement, html } from 'lit'

export class BadElement extends LitElement {
  render() {
    return html`<p>Bad</p>`
  }
}

customElements.define('bad-element', BadElement)
