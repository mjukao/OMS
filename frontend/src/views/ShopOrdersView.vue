<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore } from '../stores/order.store'
import api from '../api/base'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()

const shopId = route.params.id as string
const shopName = ref('')
const shopAddress = ref('')
const filterStatus = ref('')
const billOrder = ref<any>(null)
const pageError = ref('')

onMounted(async () => {
  try {
    const shopRes = await api.get(`/shops/${shopId}`)
    shopName.value = shopRes.data.name
    shopAddress.value = shopRes.data.address || ''
    await orderStore.fetchAll({ shopId })
  } catch (e: any) {
    pageError.value = e.response?.data?.message || 'โหลดข้อมูลไม่ได้'
  }
})

async function load() {
  try {
    await orderStore.fetchAll({ shopId, status: filterStatus.value || undefined })
  } catch (e: any) {
    pageError.value = e.response?.data?.message || 'โหลดข้อมูลไม่ได้'
  }
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

function parseShipping(addr: string) {
  const parts = addr.split(' | ')
  const name = parts[0] ? parts[0].replace('ผู้รับ: ', '') : addr
  const phone = parts[1] ? parts[1].replace('โทร: ', '') : ''
  const address = parts[2] ? parts[2].replace('ที่อยู่: ', '') : ''
  return { name, phone, address }
}

function parsePayment(note: string) {
  if (!note) return '-'
  const parts = note.split('ชำระเงิน: ')
  return parts[1] || '-'
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
    <div class="section-header">
      <div class="back-header">
        <button class="btn-back" @click="router.push(`/shops/${shopId}`)">← กลับ</button>
        <div>
          <h1 class="page-title">คำสั่งซื้อ — {{ shopName }}</h1>
        </div>
      </div>
      <button class="btn-create-shop" @click="router.push(`/shops/${shopId}/orders/create`)">
        + สร้างคำสั่งซื้อ
      </button>
    </div>

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

    <p v-if="pageError" class="txt-error">{{ pageError }}</p>
    <p v-if="orderStore.error" class="txt-error">{{ orderStore.error }}</p>
    <div v-if="orderStore.loading" class="loading">กำลังโหลด...</div>

    <table v-else class="data-table">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>ผู้รับสินค้า</th>
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
          <td>{{ parseShipping(order.shippingAddress).name }}</td>
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
            <div class="action-btns">
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
    <div class="modal bill-box">
      <div class="bill-top">
        <div>
          <div class="bill-title">ใบเสร็จ / บิล</div>
          <div class="bill-num">#{{ billOrder._id.slice(-6).toUpperCase() }}</div>
        </div>
        <button class="btn-back" @click="billOrder = null">✕</button>
      </div>

      <hr class="dashed" />

      <div class="bill-part">
        <div class="bill-sub">ผู้ส่ง</div>
        <div class="brow"><span class="blabel">ร้านค้า</span><span>{{ shopName }}</span></div>
        <div class="brow"><span class="blabel">ที่อยู่</span><span>{{ shopAddress || '-' }}</span></div>
      </div>

      <div class="bill-part">
        <div class="bill-sub">ผู้รับ</div>
        <div class="brow">
          <span class="blabel">ชื่อ</span>
          <span>{{ parseShipping(billOrder.shippingAddress).name }}</span>
        </div>
        <div class="brow">
          <span class="blabel">โทร</span>
          <span>{{ parseShipping(billOrder.shippingAddress).phone }}</span>
        </div>
        <div class="brow">
          <span class="blabel">ที่อยู่</span>
          <span>{{ parseShipping(billOrder.shippingAddress).address }}</span>
        </div>
      </div>

      <hr class="dashed" />

      <div class="bill-part">
        <div class="bill-sub">รายการสินค้า</div>
        <div v-for="item in billOrder.items" :key="item._id" class="bitem">
          <span>{{ item.productName }}</span>
          <span class="bqty">×{{ item.quantity }}</span>
          <span>฿{{ (item.unitPrice * item.quantity).toLocaleString() }}</span>
        </div>
        <hr class="dashed" style="margin:8px 0" />
        <div class="brow btotal">
          <strong>ยอดรวม</strong>
          <strong>฿{{ billOrder.totalAmount.toLocaleString() }}</strong>
        </div>
      </div>

      <hr class="dashed" />

      <div class="bill-part">
        <div class="brow">
          <span class="blabel">วิธีชำระเงิน</span>
          <span>{{ parsePayment(billOrder.note) }}</span>
        </div>
        <div class="brow">
          <span class="blabel">สถานะ</span>
          <span :class="['badge', `badge-${billOrder.status}`]">{{ statusLabel[billOrder.status] }}</span>
        </div>
        <div class="brow">
          <span class="blabel">วันที่สั่ง</span>
          <span>{{ formatDate(billOrder.createdAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
