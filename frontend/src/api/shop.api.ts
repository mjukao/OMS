import api from './base'

// ดึงร้านค้าทั้งหมด (ค้นหาได้)
export function getShops(search?: string) {
  const url = search ? `/shops?search=${encodeURIComponent(search)}` : '/shops'
  return api.get(url)
}

// ดึงร้านค้าชิ้นเดียว
export function getShop(id: string) {
  return api.get(`/shops/${id}`)
}

// สร้างร้านค้า
export function createShop(data: any) {
  return api.post('/shops', data)
}

// แก้ไขร้านค้า
export function updateShop(id: string, data: any) {
  return api.patch(`/shops/${id}`, data)
}

// ลบร้านค้า
export function deleteShop(id: string) {
  return api.delete(`/shops/${id}`)
}

// ดึงรายชื่อลูกค้าของร้าน
export function getCustomers(shopId: string) {
  return api.get(`/shops/${shopId}/customers`)
}
