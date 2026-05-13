// src/stores/product.store.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import type { Product } from '../types/product.type'

export const useProductStore = defineStore('product', () => {

  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref('')

  // ดึงสินค้าทั้งหมด — รับ search เพิ่ม (optional)
  async function fetchAll(search?: string) {
    loading.value = true
    error.value = ''
    try {
      /*
       * ถ้ามี search → ใส่ใน query string
       * GET /api/products?search=เสื้อ
       * 
       * ถ้าไม่มี → GET /api/products
       */
      const url = search
        ? `http://localhost:3000/api/products?search=${encodeURIComponent(search)}`
        : 'http://localhost:3000/api/products'

      const res = await axios.get(url)
      products.value = res.data
    } catch (e) {
      error.value = 'โหลดไม่ได้'
    } finally {
      loading.value = false
    }
  }

  // เพิ่มสินค้า
  async function createProduct(data: any) {
    try {
      const res = await axios.post('http://localhost:3000/api/products', data)
      products.value.push(res.data)
      return true
    } catch (e) {
      error.value = 'เพิ่มไม่ได้'
      return false
    }
  }

  // แก้ไขสินค้า
  async function updateProduct(id: string, data: any) {
    try {
      const res = await axios.patch(`http://localhost:3000/api/products/${id}`, data)
      const i = products.value.findIndex(p => p._id === id)
      if (i !== -1) products.value[i] = res.data
      return true
    } catch (e) {
      error.value = 'แก้ไขไม่ได้'
      return false
    }
  }

  // ลบสินค้า
  async function removeProduct(id: string) {
    try {
      await axios.delete(`http://localhost:3000/api/products/${id}`)
      products.value = products.value.filter(p => p._id !== id)
      return true
    } catch (e) {
      error.value = 'ลบไม่ได้'
      return false
    }
  }

  return { products, loading, error, fetchAll, createProduct, updateProduct, removeProduct }
})