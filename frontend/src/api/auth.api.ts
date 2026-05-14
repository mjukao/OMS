import api from './base'

export function register(name: string, email: string, password: string) {
  return api.post('/auth/register', { name, email, password })
}

export function login(email: string, password: string) {
  return api.post('/auth/login', { email, password })
}

export function getMe() {
  return api.get('/auth/me')
}

// ขอ access token ใหม่โดยใช้ refresh token
export function refreshToken(token: string) {
  return api.post('/auth/refresh', { refresh_token: token })
}
