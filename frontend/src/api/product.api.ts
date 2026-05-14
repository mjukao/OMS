import api from './base'

// ดึงสินค้าทั้งหมด (ค้นหาได้)
export function getProducts(search?: string) {
  const url = search ? `/products?search=${encodeURIComponent(search)}` : '/products'
  return api.get(url)
}

// ดึงสินค้าของร้านนั้น
export function getProductsByShop(shopId: string) {
  return api.get(`/products/shop/${shopId}`)
}

// ดึงสินค้าชิ้นเดียว
export function getProduct(id: string) {
  return api.get(`/products/${id}`)
}

// สร้างสินค้า
export function createProduct(data: any) {
  return api.post('/products', data)
}

// แก้ไขสินค้า
export function updateProduct(id: string, data: any) {
  return api.patch(`/products/${id}`, data)
}

// ลบสินค้า
export function deleteProduct(id: string) {
  return api.delete(`/products/${id}`)
}
