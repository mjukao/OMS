import api from './base'

// ดูโปรไฟล์
export function getProfile() {
  return api.get('/users/me')
}

// แก้โปรไฟล์
export function updateProfile(data: any) {
  return api.patch('/users/me', data)
}

// เพิ่มที่อยู่
export function addAddress(data: any) {
  return api.post('/users/me/addresses', data)
}

// แก้ที่อยู่
export function updateAddress(addrId: string, data: any) {
  return api.patch(`/users/me/addresses/${addrId}`, data)
}

// ลบที่อยู่
export function deleteAddress(addrId: string) {
  return api.delete(`/users/me/addresses/${addrId}`)
}

// ตั้งที่อยู่หลัก
export function setDefaultAddress(addrId: string) {
  return api.patch(`/users/me/addresses/${addrId}/default`)
}
