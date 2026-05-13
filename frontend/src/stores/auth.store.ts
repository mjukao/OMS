import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {

  const user = ref<any>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  // computed  true ถ้ามี token
  const isLoggedIn = computed(() => !!token.value)

  async function login(email: string, password: string) {
    const res = await axios.post('http://localhost:3000/api/auth/login', {
      email,
      password,
    })
    token.value = res.data.access_token//res.data คือข้อมูลที่ส่งกลับมาจาก API ในการตอบกลับคำขอ login.
    user.value = res.data.user//res.data.user คือข้อมูลของผู้ใช้ที่ได้จากการ login สำเร็จ (เช่น ชื่อ, อีเมล, หรือข้อมูลอื่นๆ ของผู้ใช้).
    localStorage.setItem('token', res.data.access_token)
  }

  async function register(name: string, email: string, password: string) {
    const res = await axios.post('http://localhost:3000/api/auth/register', {
      name,
      email,
      password,
    })
    token.value = res.data.access_token
    user.value = res.data.user//ฟังก์ชันจะเก็บ access_token และ ข้อมูลผู้ใช้ ไว้ในตัวแปร token และ user.
    localStorage.setItem('token', res.data.access_token)
  }

  async function fetchMe() {//เช็คToken ว่ามีกลับมามั้ย ถ้ามี ก็คือมีคนล้อคอิน
    if (!token.value) return
    try {
      const res = await axios.get('http://localhost:3000/api/auth/me', {//axios.getใช้ส่งเช็คไปที่URL
        headers: { Authorization: `Bearer ${token.value}` },//คือการส่งToken ไปที่URL
      })
      user.value = res.data//res.data คือข้อมูลที่ส่งกลับมาจาก API ในการตอบกลับคำขอ login.
    } catch {
      logout()//ถ้าToken ไม่ถูกต้อง หรือหมดอายุ ฟังก์ชันจะทำงาน
    }
  }

  // รับ token จาก URL (Google OAuth callback)
  function setToken(t: string) {//รับ token จาก URL (Google OAuth callback)
    token.value = t
    localStorage.setItem('token', t)
  }

  function logout() {//ลบ token และ user
    token.value = null//token.value = null  คือการลบ token ออกจากตัวแปร token.
    user.value = null//user.value = null คือการลบข้อมูลผู้ใช้ออกจากตัวแปร user.
    localStorage.removeItem('token')//คือการลบ token ออกจาก localStorage.
  }

  return { user, token, isLoggedIn, login, register, fetchMe, setToken, logout }
})