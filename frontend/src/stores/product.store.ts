import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getProducts,
  createProduct as apiCreate,
  updateProduct as apiUpdate,
  deleteProduct,
} from '../api/product.api'
import type { Product } from '../types/product.type'

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref('')

  async function fetchAll(search?: string) {
    loading.value = true
    error.value = ''
    try {
      const res = await getProducts(search)
      products.value = res.data
    } catch {
      error.value = 'โหลดไม่ได้'
    } finally {
      loading.value = false
    }
  }

  async function createProduct(data: any) {
    try {
      const res = await apiCreate(data)
      products.value.push(res.data)
      return true
    } catch {
      error.value = 'เพิ่มไม่ได้'
      return false
    }
  }

  async function updateProduct(id: string, data: any) {
    try {
      const res = await apiUpdate(id, data)
      const i = products.value.findIndex(p => p._id === id)
      if (i !== -1) products.value[i] = res.data
      return true
    } catch {
      error.value = 'แก้ไขไม่ได้'
      return false
    }
  }

  async function removeProduct(id: string) {
    try {
      await deleteProduct(id)
      products.value = products.value.filter(p => p._id !== id)
      return true
    } catch {
      error.value = 'ลบไม่ได้'
      return false
    }
  }

  return { products, loading, error, fetchAll, createProduct, updateProduct, removeProduct }
})
