export interface Product {
  _id: string
  name: string
  description: string
  price: number
  stock: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  shop?: { _id: string; name: string }
}

export interface CreateProductPayload {
  name: string
  description?: string
  price: number
  stock?: number
  shopId?: string
}

export interface UpdateProductPayload {
  name?: string
  description?: string
  price?: number
  stock?: number
  shopId?: string
}
