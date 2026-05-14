import api from './base'

// ดึงคำสั่งซื้อทั้งหมด (filter ได้)
export function getOrders(filters?: { shopId?: string; status?: string; customerId?: string }) {
  const params = new URLSearchParams()
  if (filters?.shopId) params.append('shopId', filters.shopId)
  if (filters?.status) params.append('status', filters.status)
  if (filters?.customerId) params.append('customerId', filters.customerId)
  return api.get(`/orders?${params.toString()}`)
}

// ดึงคำสั่งซื้อชิ้นเดียว
export function getOrder(id: string) {
  return api.get(`/orders/${id}`)
}

// สร้างคำสั่งซื้อ
export function createOrder(data: any) {
  return api.post('/orders', data)
}

// แก้ status / note
export function updateOrder(id: string, data: any) {
  return api.patch(`/orders/${id}`, data)
}

// ยกเลิกคำสั่งซื้อ
export function cancelOrder(id: string) {
  return api.patch(`/orders/${id}/cancel`)
}
