import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, register as apiRegister, getMe } from '../api/auth.api'
import { useShopStore } from './shop.store'
import { useOrderStore } from './order.store'

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

  return { user, token, isLoggedIn, login, register, fetchMe, setToken, logout }
})
