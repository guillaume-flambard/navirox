# vue-web pilot

A small Vue 3 web application used as the ground-truth subject for migration
inspection and planning (issue #12). It is deliberately outside the pnpm
workspace: a generated Vite app consumes none of `@memolabs-apps/*`, and as a
workspace member it would be pulled into `turbo run build`, `syncpack` and the
root install.

## Reproducible setup

Generated with create-vue pinned to `3.24.0`:

```bash
mkdir -p pilots
cd pilots
corepack pnpm dlx create-vue@3.24.0 --ts --router --pinia vue-web
```

Feature flags: TypeScript, Vue Router, Pinia. The example components and the
`About` view were then replaced by the journey below, and these files added:

- `src/api/products.ts` — `fetch` client for `public/api/products.json`
- `src/lib/favourites.ts` — `localStorage`-backed favourites (browser-only)
- `src/stores/catalogue.ts` — Pinia store holding products, load status and favourites
- `src/views/HomeView.vue`, `src/views/FavouritesView.vue`, `src/views/ProductView.vue`

Install and run:

```bash
cd pilots/vue-web
pnpm install
pnpm dev
```

## The journey

1. Home (`/`) lists products fetched from the API client.
2. Toggle a product as a favourite; the header count updates.
3. Favourites (`/favourites`) lists the favourites from local storage.
4. A product name opens the detail route `/product/:id`.

It deliberately contains the three things the issue asks a pilot to exercise:
routing (including a lazy-loaded dynamic route), shared logic and state (the
Pinia store plus the API client), and a browser-specific capability (local
storage).
