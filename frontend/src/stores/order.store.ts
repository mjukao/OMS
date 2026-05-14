import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getOrders,
  getOrder,
  createOrder as apiCreate,
  updateOrder as apiUpdate,
  cancelOrder as apiCancel,
} from '../api/order.api'
import type { CreateOrderPayload, Order, UpdateOrderPayload } from '../types/order.type'

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>([])
  const currentOrder = ref<Order | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll(filters?: { shopId?: string; customerId?: string; status?: string }) {
    loading.value = true
    error.value = null
    try {
      const res = await getOrders(filters)
      orders.value = res.data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'โหลด orders ไม่สำเร็จ'
    } finally {
      loading.value = false
    }
  }

  async function fetchOne(id: string) {
    loading.value = true
    error.value = null
    try {
      const res = await getOrder(id)
      currentOrder.value = res.data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'โหลด order ไม่สำเร็จ'
    } finally {
      loading.value = false
    }
  }

  async function createOrder(payload: CreateOrderPayload) {
    loading.value = true
    error.value = null
    try {
      const res = await apiCreate(payload)
      orders.value.unshift(res.data)
      return res.data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'สร้าง order ไม่สำเร็จ'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateOrder(id: string, payload: UpdateOrderPayload) {
    loading.value = true
    error.value = null
    try {
      const res = await apiUpdate(id, payload)
      const idx = orders.value.findIndex(o => o._id === id)
      if (idx !== -1) orders.value.splice(idx, 1, res.data)
      if (currentOrder.value?._id === id) currentOrder.value = res.data
      return res.data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'อัพเดต order ไม่สำเร็จ'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function cancelOrder(id: string) {
    loading.value = true
    error.value = null
    try {
      const res = await apiCancel(id)
      const idx = orders.value.findIndex(o => o._id === id)
      if (idx !== -1) orders.value[idx] = res.data
      if (currentOrder.value?._id === id) currentOrder.value = res.data
      return res.data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'ยกเลิก order ไม่สำเร็จ'
      throw e
    } finally {
      loading.value = false
    }
  }

  return { orders, currentOrder, loading, error, fetchAll, fetchOne, createOrder, updateOrder, cancelOrder }
})
