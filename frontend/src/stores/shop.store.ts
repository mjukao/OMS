import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getShops, createShop as apiCreate, updateShop as apiUpdate, deleteShop } from '../api/shop.api'
import type { Shop } from '../types/shop.type'

export const useShopStore = defineStore('shop', () => {
  const shops = ref<Shop[]>([])
  const loading = ref(false)
  const error = ref('')

  async function fetchAll(search?: string) {
    loading.value = true
    error.value = ''
    try {
      const res = await getShops(search)
      shops.value = res.data
    } catch {
      error.value = 'โหลดร้านค้าไม่ได้'
    } finally {
      loading.value = false
    }
  }

  async function createShop(data: any) {
    try {
      const res = await apiCreate(data)
      shops.value.push(res.data)
      return true
    } catch {
      error.value = 'เพิ่มร้านค้าไม่ได้'
      return false
    }
  }

  async function updateShop(id: string, data: any) {
    try {
      const res = await apiUpdate(id, data)
      const i = shops.value.findIndex(s => s._id === id)
      if (i !== -1) shops.value[i] = res.data
      return true
    } catch {
      error.value = 'แก้ไขร้านค้าไม่ได้'
      return false
    }
  }

  async function removeShop(id: string) {
    try {
      await deleteShop(id)
      shops.value = shops.value.filter(s => s._id !== id)
      return true
    } catch {
      error.value = 'ลบร้านค้าไม่ได้'
      return false
    }
  }

  return { shops, loading, error, fetchAll, createShop, updateShop, removeShop }
})
