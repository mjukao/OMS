<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useShopStore } from '../stores/shop.store'
import { getCustomers } from '../api/shop.api'

const shopStore = useShopStore()

const selectedShopId = ref('')
const expandedKey = ref<string | null>(null)
const loading = ref(false)
const customers = ref<any[]>([])

onMounted(async () => {
  await shopStore.fetchAll()
  await load()
})

async function load() {
  loading.value = true
  expandedKey.value = null
  try {
    if (selectedShopId.value) {
      const res = await getCustomers(selectedShopId.value)
      customers.value = res.data
    } else {
      // รวม customers จากทุกร้านของ account นี้
      const results = await Promise.all(
        shopStore.shops.map((shop) => getCustomers(shop._id).then((r) => r.data))
      )
      // รวม unique customer ด้วย name+phone เป็น key
      const map = new Map<string, any>()
      for (const list of results) {
        for (const c of list) {
          const key = `${c.receiver.name}|${c.receiver.phone}`
          if (!map.has(key)) {
            map.set(key, { ...c })
          } else {
            const exist = map.get(key)!
            exist.orderCount += c.orderCount
            exist.totalSpent += c.totalSpent
            exist.orders = [...exist.orders, ...c.orders]
          }
        }
      }
      customers.value = Array.from(map.values())
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function toggle(key: string) {
  expandedKey.value = expandedKey.value === key ? null : key
}

function rowKey(c: any) {
  return `${c.receiver.name}|${c.receiver.phone}`
}

const totalOrders = computed(() => customers.value.reduce((s, c) => s + c.orderCount, 0))
const totalRevenue = computed(() => customers.value.reduce((s, c) => s + c.totalSpent, 0))

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}
</script>

<template>
  <div class="page">

    <!-- Header -->
    <div class="section-header">
      <h1 class="page-title">ลูกค้า / ผู้รับสินค้า</h1>
      <select v-model="selectedShopId" @change="load" class="filter-bar" style="padding:7px 12px;border:1px solid #ddd;border-radius:6px;font-size:13px;background:#fff">
        <option value="">ทุกร้าน</option>
        <option v-for="shop in shopStore.shops" :key="shop._id" :value="shop._id">
          {{ shop.name }}
        </option>
      </select>
    </div>

    <div v-if="loading" class="loading">กำลังโหลด...</div>
    <div v-else-if="customers.length === 0" class="txt-gray">ยังไม่มีลูกค้า</div>

    <template v-else>
      <!-- Summary -->
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <div class="form-box" style="flex:1;min-width:120px;padding:14px;margin:0">
          <div style="font-size:12px;color:#6b7280">ผู้รับสินค้าทั้งหมด</div>
          <div style="font-size:22px;font-weight:600">{{ customers.length }}</div>
        </div>
        <div class="form-box" style="flex:1;min-width:120px;padding:14px;margin:0">
          <div style="font-size:12px;color:#6b7280">ออเดอร์ทั้งหมด</div>
          <div style="font-size:22px;font-weight:600">{{ totalOrders }}</div>
        </div>
        <div class="form-box" style="flex:1;min-width:120px;padding:14px;margin:0">
          <div style="font-size:12px;color:#6b7280">ยอดขายรวม</div>
          <div style="font-size:22px;font-weight:600">฿{{ totalRevenue.toLocaleString() }}</div>
        </div>
      </div>

      <!-- Customer Table -->
      <table class="data-table">
        <thead>
          <tr>
            <th>ชื่อผู้รับสินค้า</th>
            <th>เบอร์โทร</th>
            <th>ที่อยู่</th>
            <th>จำนวน Order</th>
            <th>ยอดรวม</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <template v-for="c in customers" :key="rowKey(c)">
            <tr :class="{ 'row-active': expandedKey === rowKey(c) }" style="cursor:pointer"
              @click="toggle(rowKey(c))">
              <td><div style="font-weight:500">{{ c.receiver.name || '-' }}</div></td>
              <td>{{ c.receiver.phone || '-' }}</td>
              <td style="font-size:12px;color:#6b7280;max-width:180px">{{ c.receiver.address || '-' }}</td>
              <td>{{ c.orderCount }} ครั้ง</td>
              <td style="font-weight:500">฿{{ c.totalSpent.toLocaleString() }}</td>
              <td style="color:#6b7280;font-size:12px">{{ expandedKey === rowKey(c) ? '▲' : '▼' }}</td>
            </tr>

            <!-- Orders expand -->
            <tr v-if="expandedKey === rowKey(c)">
              <td colspan="6" style="padding:0;background:#f9fafb">
                <table style="width:100%;font-size:12px;border-collapse:collapse">
                  <thead>
                    <tr style="background:#f3f4f6">
                      <th style="padding:6px 14px;text-align:left;color:#6b7280;font-weight:500">ร้านค้า</th>
                      <th style="padding:6px 14px;text-align:left;color:#6b7280;font-weight:500">ยอดรวม</th>
                      <th style="padding:6px 14px;text-align:left;color:#6b7280;font-weight:500">Status</th>
                      <th style="padding:6px 14px;text-align:left;color:#6b7280;font-weight:500">วันที่สั่ง</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="order in c.orders" :key="order._id" style="border-top:1px solid #e5e7eb">
                      <td style="padding:8px 14px">{{ order.shopName }}</td>
                      <td style="padding:8px 14px;font-weight:500">฿{{ order.totalAmount.toLocaleString() }}</td>
                      <td style="padding:8px 14px">
                        <span :class="['badge', `badge-${order.status}`]">{{ order.status }}</span>
                      </td>
                      <td style="padding:8px 14px;color:#6b7280">{{ formatDate(order.createdAt) }}</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </template>

  </div>
</template>
