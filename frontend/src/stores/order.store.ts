import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';
import type {
  CreateOrderPayload,
  Order,
  UpdateOrderPayload,
} from '../types/order.type';

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>([]);
  const currentOrder = ref<Order | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);


  async function fetchAll(filters?: {
    shopId?: string;
    customerId?: string;
    status?: string;
  }) {
    loading.value = true;
    error.value = null;
    try {
      const params = new URLSearchParams();
      if (filters?.shopId) params.append('shopId', filters.shopId);
      if (filters?.customerId) params.append('customerId', filters.customerId);
      if (filters?.status) params.append('status', filters.status);

      const { data } = await api.get<Order[]>(`/orders?${params.toString()}`);
      orders.value = data;
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'โหลด orders ไม่สำเร็จ';
    } finally {
      loading.value = false;
    }
  }

  async function fetchOne(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.get<Order>(`/orders/${id}`);
      currentOrder.value = data;
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'โหลด order ไม่สำเร็จ';
    } finally {
      loading.value = false;
    }
  }

  async function createOrder(payload: CreateOrderPayload) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.post<Order>('/orders', payload);
      orders.value.unshift(data);
      return data;
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'สร้าง order ไม่สำเร็จ';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // UPDATE STATUS
 async function updateOrder(id: string, payload: UpdateOrderPayload) {
    loading.value = true
    error.value = null
    try {
        const { data } = await api.patch<Order>(`/orders/${id}`, payload);
        const idx = orders.value.findIndex((o) => o._id === id);
        if (idx !== -1) orders.value.splice(idx, 1, data); 
        if (currentOrder.value?._id === id) currentOrder.value = data;
        return data;
    } catch (e: any) {
        error.value = e.response?.data?.message ?? 'อัพเดต order ไม่สำเร็จ';
        throw e;
    } finally {
        loading.value = false;
    }
}

  //CANCEL
  async function cancelOrder(id: string) {
    loading.value = true;
    error.value = null;
    try {
      const { data } = await api.patch<Order>(`/orders/${id}/cancel`);
      const idx = orders.value.findIndex((o) => o._id === id);
      if (idx !== -1) orders.value[idx] = data;
      if (currentOrder.value?._id === id) currentOrder.value = data;
      return data;
    } catch (e: any) {
      error.value = e.response?.data?.message ?? 'ยกเลิก order ไม่สำเร็จ';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    orders,
    currentOrder,
    loading,
    error,
    fetchAll,
    fetchOne,
    createOrder,
    updateOrder,
    cancelOrder,
  };
});
