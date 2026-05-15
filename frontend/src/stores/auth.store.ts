import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { login as apiLogin, register as apiRegister, getMe } from '../api/auth.api'
import { useShopStore } from './shop.store'
import { useOrderStore } from './order.store'

const API_BASE = 'http://localhost:3000/api'

export const useAuthStore = defineStore('auth', () => {

  const user = ref<any>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isLoggedIn = computed(() => !!token.value)

  function saveTokens(accessToken: string, refreshToken: string) {
    token.value = accessToken
    localStorage.setItem('token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
  }

  async function login(email: string, password: string) {
    const res = await apiLogin(email, password)
    saveTokens(res.data.access_token, res.data.refresh_token)
    user.value = res.data.user
  }

  async function register(name: string, email: string, password: string) {
    const res = await apiRegister(name, email, password)
    saveTokens(res.data.access_token, res.data.refresh_token)
    user.value = res.data.user
  }

  async function fetchMe() {
    if (!token.value) return
    try {
      const res = await getMe()
      user.value = res.data
    } catch {
      logout()
    }
  }

  async function refreshAndRestore(): Promise<void> {
    const stored = localStorage.getItem('refresh_token')
    if (!stored) { logout(); return }
    try {
      const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: stored })
      token.value = data.access_token
      localStorage.setItem('token', data.access_token)
      const me = await getMe()
      user.value = me.data
    } catch {
      logout()
    }
  }

  // รับ token จาก Google OAuth callback URL
  function setToken(accessToken: string, refreshToken?: string) {
    token.value = accessToken
    localStorage.setItem('token', accessToken)
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken)
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    // ล้าง cache ของ store อื่นด้วย เพื่อไม่ให้เห็นข้อมูลของ account ก่อนหน้า
    clearOtherStores()
  }

  function clearOtherStores() {
    try {
      const shopStore = useShopStore()
      const orderStore = useOrderStore()
      shopStore.shops = []
      orderStore.orders = []
    } catch {
      // ignore
    }
  }

  return { user, token, isLoggedIn, login, register, fetchMe, refreshAndRestore, setToken, logout }
})
