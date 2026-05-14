import axios from 'axios'

const BASE_URL = 'http://localhost:3000/api'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// แนบ token ทุก request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh: ถ้าได้ 401 ให้ลอง refresh token ก่อน logout
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    // ถ้า 401 และยังไม่ได้ลอง refresh
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        // ไม่มี refresh token → logout
        clearAuth()
        return Promise.reject(error)
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })
        const newToken = res.data.access_token
        localStorage.setItem('token', newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original) // ยิง request เดิมอีกครั้ง
      } catch {
        clearAuth()
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  },
)

function clearAuth() {
  localStorage.removeItem('token')
  localStorage.removeItem('refresh_token')
  window.location.href = '/login'
}

export default api
