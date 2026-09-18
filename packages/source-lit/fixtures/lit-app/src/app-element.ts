import { LitElement, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'

@customElement('app-root')
export class AppRoot extends LitElement {
  @state()
  private visits = 0

  connectedCallback(): void {
    super.connectedCallback()
    const saved = localStorage.getItem('visits')
    this.visits = saved === null ? 0 : Number(saved)
    localStorage.setItem('visits', String(this.visits + 1))
  }

  render() {
    return html`
      <main>
        <h1>${this.visits} visits</h1>
        <x-counter></x-counter>
        <x-list></x-list>
      </main>
    `
  }
}
