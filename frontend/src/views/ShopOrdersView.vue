<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore } from '../stores/order.store'
import type { Order } from '../types/order.type'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()

const shopId = route.params.id as string
const shopName = ref('')
const shopAddress = ref('')
const filterStatus = ref('')
const billOrder = ref<Order | null>(null)

onMounted(async () => {
  const [shopRes] = await Promise.all([
    axios.get(`http://localhost:3000/api/shops/${shopId}`),
    orderStore.fetchAll({ shopId }),
  ])
  shopName.value = shopRes.data.name
  shopAddress.value = shopRes.data.address || ''
})

async function load() {
  await orderStore.fetchAll({ shopId, status: filterStatus.value || undefined })
}

async function changeStatus(id: string, event: Event) {
  const status = (event.target as HTMLSelectElement).value
  await orderStore.updateOrder(id, { status: status as any })
  await load()
}

async function cancel(id: string) {
  if (!confirm('ยืนยันการยกเลิก order?')) return
  await orderStore.cancelOrder(id)
  await load()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// แยกข้อมูลผู้รับจาก shippingAddress string
function parseShipping(addr: string) {
  const name = addr.match(/ผู้รับ: ([^|]+)/)?.[1]?.trim() ?? addr
  const phone = addr.match(/โทร: ([^|]+)/)?.[1]?.trim() ?? ''
  const address = addr.match(/ที่อยู่: (.+)/)?.[1]?.trim() ?? ''
  return { name, phone, address }
}

// แยกวิธีชำระเงินจาก note
function parsePayment(note?: string) {
  return note?.match(/ชำระเงิน: (.+)/)?.[1] ?? '-'
}

const statusLabel: Record<string, string> = {
  pending: 'รอดำเนินการ',
  confirmed: 'ยืนยันแล้ว',
  shipped: 'จัดส่งแล้ว',
  delivered: 'ส่งถึงแล้ว',
  cancelled: 'ยกเลิกแล้ว',
}
</script>

<template>
  <div class="page">
    <!-- Header -->
    <div class="section-header">
      <div class="shop-products-header">
        <button class="btn-back" @click="router.push(`/shops/${shopId}`)">← กลับ</button>
        <div>
          <h1 class="shops-title">คำสั่งซื้อ — {{ shopName }}</h1>
        </div>
      </div>
      <button class="btn-create-shop" @click="router.push(`/shops/${shopId}/orders/create`)">
        + สร้างคำสั่งซื้อ
      </button>
    </div>

    <!-- Filter -->
    <div class="filter-bar">
      <select v-model="filterStatus" @change="load">
        <option value="">ทุก status</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="shipped">Shipped</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>

    <p v-if="orderStore.error" class="txt-error">{{ orderStore.error }}</p>
    <div v-if="orderStore.loading" class="loading">กำลังโหลด...</div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>ลูกค้า</th>
          <th>รายการสินค้า</th>
          <th>ยอดรวม</th>
          <th>Status</th>
          <th>วันที่สั่ง</th>
          <th>จัดการ</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="orderStore.orders.length === 0">
          <td colspan="7" class="empty">ไม่มีคำสั่งซื้อในร้านนี้</td>
        </tr>
        <tr v-for="order in orderStore.orders" :key="order._id">
          <td>{{ order._id.slice(-6).toUpperCase() }}</td>
          <td>{{ typeof order.user === 'object' ? (order.user as any)?.name : order.user }}</td>
          <td>
            <ul class="item-list">
              <li v-for="item in order.items" :key="item._id">
                {{ item.productName }}
                <span class="item-meta">×{{ item.quantity }} (฿{{ item.unitPrice?.toLocaleString() }})</span>
              </li>
            </ul>
          </td>
          <td>฿{{ order.totalAmount.toLocaleString() }}</td>
          <td>
            <span :class="['badge', `badge-${order.status}`]">{{ order.status }}</span>
          </td>
          <td>{{ formatDate(order.createdAt) }}</td>
          <td>
            <div class="action-btns" style="flex-wrap:wrap;gap:4px">
              <button class="btn-sm btn-sm-view" @click="billOrder = order">ดูบิล</button>
              <select :value="order.status" :disabled="['cancelled', 'delivered'].includes(order.status)"
                @change="changeStatus(order._id, $event)">
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
              <button class="btn-sm btn-sm-delete" :disabled="['cancelled', 'delivered'].includes(order.status)"
                @click="cancel(order._id)">
                ยกเลิก
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Bill Modal -->
  <div v-if="billOrder" class="modal-backdrop" @click.self="billOrder = null">
    <div class="modal bill-modal">
      <div class="bill-header">
        <div>
          <div class="bill-title">ใบเสร็จ / บิล</div>
          <div class="bill-id">#{{ billOrder._id.slice(-6).toUpperCase() }}</div>
        </div>
        <button class="btn-back" @click="billOrder = null">✕</button>
      </div>

      <div class="bill-divider"></div>

      <!-- ผู้ส่ง -->
      <div class="bill-section">
        <div class="bill-section-title">📦 ผู้ส่ง</div>
        <div class="bill-row"><span class="bill-label">ร้านค้า</span><span>{{ shopName }}</span></div>
        <div class="bill-row"><span class="bill-label">ที่อยู่</span><span>{{ shopAddress || '-' }}</span></div>
      </div>

      <!-- ผู้รับ -->
      <div class="bill-section">
        <div class="bill-section-title">📬 ผู้รับ</div>
        <div class="bill-row">
          <span class="bill-label">ชื่อ</span>
          <span>{{ parseShipping(billOrder.shippingAddress).name }}</span>
        </div>
        <div class="bill-row">
          <span class="bill-label">โทร</span>
          <span>{{ parseShipping(billOrder.shippingAddress).phone }}</span>
        </div>
        <div class="bill-row">
          <span class="bill-label">ที่อยู่</span>
          <span>{{ parseShipping(billOrder.shippingAddress).address }}</span>
        </div>
      </div>

      <div class="bill-divider"></div>

      <!-- รายการสินค้า -->
      <div class="bill-section">
        <div class="bill-section-title">🛒 รายการสินค้า</div>
        <div v-for="item in billOrder.items" :key="item._id" class="bill-item-row">
          <span>{{ item.productName }}</span>
          <span class="bill-item-qty">×{{ item.quantity }}</span>
          <span>฿{{ (item.unitPrice * item.quantity).toLocaleString() }}</span>
        </div>
        <div class="bill-divider" style="margin:8px 0"></div>
        <div class="bill-row bill-total-row">
          <strong>ยอดรวม</strong>
          <strong>฿{{ billOrder.totalAmount.toLocaleString() }}</strong>
        </div>
      </div>

      <div class="bill-divider"></div>

      <!-- ข้อมูลอื่น -->
      <div class="bill-section">
        <div class="bill-row">
          <span class="bill-label">วิธีชำระเงิน</span>
          <span>{{ parsePayment(billOrder.note) }}</span>
        </div>
        <div class="bill-row">
          <span class="bill-label">สถานะ</span>
          <span :class="['badge', `badge-${billOrder.status}`]">{{ statusLabel[billOrder.status] }}</span>
        </div>
        <div class="bill-row">
          <span class="bill-label">วันที่สั่ง</span>
          <span>{{ formatDate(billOrder.createdAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
