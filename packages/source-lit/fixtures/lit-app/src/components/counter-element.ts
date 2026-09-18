import { LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'

@customElement('x-counter')
export class CounterElement extends LitElement {
  @state()
  private count = 0

  private increment(): void {
    this.count += 1
  }

  render() {
    return html`
      <button type="button" @click=${this.increment}>Press me</button>
      <span>${this.count}</span>
    `
  }
}
