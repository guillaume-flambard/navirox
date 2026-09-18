import { LitElement, html } from 'lit'
import { Router } from '@lit-labs/router'

export class AppRouter extends LitElement {
  private router = new Router(this, [
    { path: '/', render: () => html`<x-list></x-list>` },
    { path: '/profile/:id', render: ({ id }) => html`<x-profile .id=${id}></x-profile>` },
    { path: '/child/*', render: () => html`<x-list></x-list>` },
    { pattern: new URLPattern({ pathname: '/legacy' }), render: () => html`<h1>Legacy</h1>` },
    {
      path: '/admin',
      render: () => html`<h1>Admin</h1>`,
      enter: async () => {
        await import('./views/profile-view.js')
      },
    },
  ])

  render() {
    return this.router.outlet()
  }
}
