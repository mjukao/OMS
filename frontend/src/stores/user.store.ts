// src/stores/user.store.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'
import type {
  Address,
  CreateAddressPayload,
  Customer,
  UpdateProfilePayload,
  UserProfile,
} from '../types/user.type'

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(null)
  const customers = ref<Customer[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── Profile ───────────────────────────────────────────
  async function fetchProfile() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<UserProfile>('/users/me')
      profile.value = data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'โหลดโปรไฟล์ไม่สำเร็จ'
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(payload: UpdateProfilePayload) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.patch<UserProfile>('/users/me', payload)
      profile.value = data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'แก้ไขโปรไฟล์ไม่สำเร็จ'
      throw e
    } finally {
      loading.value = false
    }
  }

  // ── Addresses ─────────────────────────────────────────
  async function addAddress(payload: CreateAddressPayload) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.post<UserProfile>('/users/me/addresses', payload)
      profile.value = data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'เพิ่มที่อยู่ไม่สำเร็จ'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateAddress(addrId: string, payload: Partial<Address>) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.patch<UserProfile>(`/users/me/addresses/${addrId}`, payload)
      profile.value = data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'แก้ไขที่อยู่ไม่สำเร็จ'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deleteAddress(addrId: string) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.delete<UserProfile>(`/users/me/addresses/${addrId}`)
      profile.value = data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'ลบที่อยู่ไม่สำเร็จ'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function setDefaultAddress(addrId: string) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.patch<UserProfile>(`/users/me/addresses/${addrId}/default`)
      profile.value = data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'ตั้งค่าที่อยู่ไม่สำเร็จ'
      throw e
    } finally {
      loading.value = false
    }
  }

  // ── Customer List ─────────────────────────────────────
  async function fetchCustomers(shopId: string) {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<Customer[]>(`/shops/${shopId}/customers`)
      customers.value = data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'โหลดลูกค้าไม่สำเร็จ'
    } finally {
      loading.value = false
    }
  }

  return {
    profile,
    customers,
    loading,
    error,
    fetchProfile,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    fetchCustomers,
  }
})
