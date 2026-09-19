export interface Product {
  id: number
  name: string
  price: number
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${import.meta.env.BASE_URL}api/products.json`)
  if (!response.ok) {
    throw new Error(`Failed to load products: ${response.status}`)
  }
  return (await response.json()) as Product[]
}
