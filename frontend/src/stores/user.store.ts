import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getProfile,
  updateProfile as apiUpdateProfile,
  addAddress as apiAddAddress,
  updateAddress as apiUpdateAddress,
  deleteAddress as apiDeleteAddress,
  setDefaultAddress as apiSetDefault,
} from '../api/user.api'
import { getCustomers as apiGetCustomers } from '../api/shop.api'
import type { Address, CreateAddressPayload, Customer, UpdateProfilePayload, UserProfile } from '../types/user.type'

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(null)
  const customers = ref<Customer[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchProfile() {
    loading.value = true
    error.value = null
    try {
      const res = await getProfile()
      profile.value = res.data
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
      const res = await apiUpdateProfile(payload)
      profile.value = res.data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'แก้ไขโปรไฟล์ไม่สำเร็จ'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function addAddress(payload: CreateAddressPayload) {
    loading.value = true
    error.value = null
    try {
      const res = await apiAddAddress(payload)
      profile.value = res.data
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
      const res = await apiUpdateAddress(addrId, payload)
      profile.value = res.data
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
      const res = await apiDeleteAddress(addrId)
      profile.value = res.data
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
      const res = await apiSetDefault(addrId)
      profile.value = res.data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'ตั้งค่าที่อยู่ไม่สำเร็จ'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchCustomers(shopId: string) {
    loading.value = true
    error.value = null
    try {
      const res = await apiGetCustomers(shopId)
      customers.value = res.data
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'โหลดลูกค้าไม่สำเร็จ'
    } finally {
      loading.value = false
    }
  }

  return {
    profile, customers, loading, error,
    fetchProfile, updateProfile,
    addAddress, updateAddress, deleteAddress, setDefaultAddress,
    fetchCustomers,
  }
})
