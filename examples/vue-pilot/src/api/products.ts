/**
 * Hand-written replacement for `pilots/vue-web/src/api/products.ts`.
 *
 * The web version fetched `${import.meta.env.BASE_URL}api/products.json`, a
 * static asset served by Vite. A native bundle has no base URL and no static
 * asset server, so the list is bundled here instead.
 *
 * The `Product` shape and the `async fetchProducts(): Promise<Product[]>` contract
 * are kept exactly, because that is the surface the migrated store awaits.
 */

export interface Product {
  id: number;
  name: string;
  price: number;
}

const PRODUCTS: readonly Product[] = [
  { id: 1, name: 'Aurora Lamp', price: 49 },
  { id: 2, name: 'Basalt Mug', price: 18 },
  { id: 3, name: 'Cedar Stool', price: 72 },
  { id: 4, name: 'Dune Throw', price: 35 },
  { id: 5, name: 'Ember Kettle', price: 64 },
];

export async function fetchProducts(): Promise<Product[]> {
  return PRODUCTS.map(product => ({ ...product }));
}
