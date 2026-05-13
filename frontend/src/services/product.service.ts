import api from './api'
import type { CreateProductPayload, UpdateProductPayload } from '../types/product.type'

export const productService = {
  // ดึงข้อมูลสินค้า
  getAll() {
    return api.get('/products')
  },
  
  // สร้างสินค้าใหม่
  create(payload: CreateProductPayload) {
    return api.post('/products', payload)
  },
  
  // อัปเดตข้อมูลสินค้า
  update(id: string, payload: UpdateProductPayload) {
    return api.patch(`/products/${id}`, payload)
  },
  
  // ลบสินค้า
  remove(id: string) {
    return api.delete(`/products/${id}`)
  },
}