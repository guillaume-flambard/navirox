import { LitElement, html } from 'lit'

export class ListElement extends LitElement {
  static properties = {
    rows: { type: Array },
  }

  private rows: string[] = []

  render() {
    return html`<ul>
      ${this.rows.map((row) => html`<li>${row}</li>`)}
    </ul>`
  }
}

customElements.define('x-list', ListElement)
