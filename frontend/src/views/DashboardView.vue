<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getOrders } from '../api/order.api'
import { useShopStore } from '../stores/shop.store'
import type { Order } from '../types/order.type'

type Range = 'today' | '7d' | '30d'

const shopStore = useShopStore()
const allOrders = ref<Order[]>([])
const loading = ref(false)
const range = ref<Range>('7d')
const selectedShopId = ref('')

onMounted(async () => {
  loading.value = true
  try {
    await shopStore.fetchAll()
    selectedShopId.value = shopStore.shops[0]?._id ?? ''
    const res = await getOrders()
    allOrders.value = res.data
  } finally {
    loading.value = false
  }
})

function startOfDay(d: Date): Date {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

const rangeWindow = computed<[Date, Date]>(() => {
  const now = new Date()
  if (range.value === 'today') return [startOfDay(now), now]
  const days = range.value === '7d' ? 6 : 29
  const from = new Date(now)
  from.setDate(from.getDate() - days)
  return [startOfDay(from), now]
})

const prevWindow = computed<[Date, Date]>(() => {
  const [from, to] = rangeWindow.value
  const diff = to.getTime() - from.getTime()
  return [new Date(from.getTime() - diff), from]
})

function inWindow(o: Order, [from, to]: [Date, Date]) {
  const d = new Date(o.createdAt)
  return d >= from && d <= to
}

function matchShop(o: Order) {
  if (!selectedShopId.value) return true
  const id = typeof o.shop === 'object' ? o.shop._id : o.shop
  return id === selectedShopId.value
}

const filtered = computed(() => allOrders.value.filter(o => matchShop(o) && inWindow(o, rangeWindow.value)))
const prevFiltered = computed(() => allOrders.value.filter(o => matchShop(o) && inWindow(o, prevWindow.value)))
const delivered = computed(() => filtered.value.filter(o => o.status === 'delivered'))
const prevDelivered = computed(() => prevFiltered.value.filter(o => o.status === 'delivered'))

const totalSales = computed(() => delivered.value.reduce((s, o) => s + o.totalAmount, 0))
const prevSales = computed(() => prevDelivered.value.reduce((s, o) => s + o.totalAmount, 0))
const salesPct = computed(() =>
  prevSales.value ? (totalSales.value - prevSales.value) / prevSales.value * 100 : null
)
const totalCount = computed(() => filtered.value.length)
const cancelledCount = computed(() => filtered.value.filter(o => o.status === 'cancelled').length)
const avgOrder = computed(() =>
  delivered.value.length ? Math.round(totalSales.value / delivered.value.length) : 0
)

// Graph
const graphPoints = computed(() => {
  const [from] = rangeWindow.value
  if (range.value === 'today') {
    const hrs = Array.from({ length: 24 }, (_, i) => ({ label: `${i}:00`, val: 0 }))
    for (const o of delivered.value) {
      const h = hrs[new Date(o.createdAt).getHours()]
      if (h) h.val += o.totalAmount
    }
    return hrs
  }
  const days = range.value === '7d' ? 7 : 30
  const pts = Array.from({ length: days }, (_, i) => {
    const d = new Date(from)
    d.setDate(d.getDate() + i)
    return { label: d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }), val: 0 }
  })
  for (const o of delivered.value) {
    const diff = Math.floor(
      (new Date(o.createdAt).getTime() - startOfDay(from).getTime()) / 86400000
    )
    if (diff >= 0 && diff < days) {
      const p = pts[diff]
      if (p) p.val += o.totalAmount
    }
  }
  return pts
})

const svgLine = computed(() => {
  const data = graphPoints.value
  const W = 600, H = 100, pad = 8
  const max = Math.max(...data.map(d => d.val), 1)
  const pts = data.map((d, i) => ({
    x: pad + (i / Math.max(data.length - 1, 1)) * (W - 2 * pad),
    y: H - pad - (d.val / max) * (H - 2 * pad),
  }))
  if (pts.length < 2) return ''
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
})

const graphLabels = computed(() => {
  const data = graphPoints.value
  const n = data.length
  const step = range.value === '30d' ? 5 : range.value === 'today' ? 3 : 1
  return data
    .map((d, i) => ({ label: d.label, pct: n > 1 ? (i / (n - 1)) * 100 : 0 }))
    .filter((_, i) => i % step === 0)
})

// Top Products
const topProducts = computed(() => {
  const map = new Map<string, number>()
  for (const o of delivered.value)
    for (const item of o.items)
      map.set(item.productName, (map.get(item.productName) ?? 0) + item.quantity)
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => ({ name, qty }))
})
const maxQty = computed(() => Math.max(...topProducts.value.map(p => p.qty), 1))

// Recent Orders
const recentOrders = computed(() =>
  [...filtered.value]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
)

function shopName(o: Order) {
  return typeof o.shop === 'object' ? o.shop.name : o.shop
}

function fmt(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' }) + ' ' +
    d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
}

function pctStr(v: number) {
  return (v >= 0 ? '+' : '') + v.toFixed(1) + '%'
}
</script>

<template>
  <div class="page">
    <!-- Header -->
    <div class="section-header">
      <div style="display:flex;align-items:center;gap:12px">
        <h1 class="page-title">ภาพรวม</h1>
        <select v-model="selectedShopId"
          style="padding:6px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;background:#fff">
          <option v-for="s in shopStore.shops" :key="s._id" :value="s._id">{{ s.name }}</option>
        </select>
      </div>
      <div style="display:flex;gap:6px">
        <button
          v-for="r in ([{ k: 'today', l: 'วันนี้' }, { k: '7d', l: '7 วัน' }, { k: '30d', l: '30 วัน' }] as const)"
          :key="r.k" @click="range = r.k" class="btn-cancel"
          :style="range === r.k ? 'background:#333;color:#fff;border-color:#333' : ''">{{ r.l }}</button>
      </div>
    </div>


    <div v-if="loading" class="loading">กำลังโหลด...</div>

    <template v-else>
      <!-- KPI -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
        <div class="form-box" style="margin:0;padding:16px">
          <div style="font-size:12px;color:#888;margin-bottom:6px">ยอดขายรวม</div>
          <div style="font-size:20px;font-weight:700">฿{{ totalSales.toLocaleString() }}</div>
          <div v-if="salesPct !== null" :style="{ fontSize: '12px', color: salesPct >= 0 ? '#16a34a' : '#dc2626' }">
            {{ pctStr(salesPct) }} จากช่วงก่อน
          </div>
        </div>
        <div class="form-box" style="margin:0;padding:16px">
          <div style="font-size:12px;color:#888;margin-bottom:6px">ออเดอร์ทั้งหมด</div>
          <div style="font-size:20px;font-weight:700">{{ totalCount }}</div>
          <div style="font-size:12px;color:#888">รายการ</div>
        </div>
        <div class="form-box" style="margin:0;padding:16px">
          <div style="font-size:12px;color:#888;margin-bottom:6px">ออเดอร์ยกเลิก</div>
          <div style="font-size:20px;font-weight:700" :style="{ color: cancelledCount > 0 ? '#dc2626' : '#111' }">{{
            cancelledCount }}</div>
          <div style="font-size:12px;color:#888">รายการ</div>
        </div>
        <div class="form-box" style="margin:0;padding:16px">
          <div style="font-size:12px;color:#888;margin-bottom:6px">เฉลี่ยต่อออเดอร์</div>
          <div style="font-size:20px;font-weight:700">฿{{ avgOrder.toLocaleString() }}</div>
          <div style="font-size:12px;color:#888">เฉพาะ delivered</div>
        </div>
      </div>

      <!-- Graph -->
      <div class="form-box" style="margin-bottom:16px">
        <div style="font-size:13px;font-weight:600;margin-bottom:10px">ยอดขาย (delivered)</div>
        <svg viewBox="0 0 600 100" preserveAspectRatio="none" style="width:100%;height:110px;display:block">
          <path :d="svgLine" fill="none" stroke="#2563eb" stroke-width="2" />
        </svg>
        <div style="position:relative;height:18px;margin-top:4px">
          <span v-for="pt in graphLabels" :key="pt.pct"
            :style="{ position: 'absolute', left: pt.pct + '%', transform: 'translateX(-50%)', fontSize: '10px', color: '#aaa', whiteSpace: 'nowrap' }">{{
              pt.label }}</span>
        </div>
      </div>

      <!-- Top Products + Recent Orders -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <!-- Top Products -->
        <div class="form-box" style="margin:0">
          <div style="font-size:13px;font-weight:600;margin-bottom:12px">สินค้าขายดี</div>
          <div v-if="!topProducts.length" class="txt-gray">ยังไม่มีข้อมูล</div>
          <div v-for="p in topProducts" :key="p.name" style="margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
              <span>{{ p.name }}</span>
              <span style="color:#888">{{ p.qty }}</span>
            </div>
            <div style="background:#eee;border-radius:3px;height:6px">
              <div
                :style="{ width: (p.qty / maxQty * 100) + '%', background: '#2563eb', height: '100%', borderRadius: '3px' }" />
            </div>
          </div>
        </div>

        <!-- Recent Orders -->
        <div class="form-box" style="margin:0">
          <div style="font-size:13px;font-weight:600;margin-bottom:12px">ออเดอร์ล่าสุด</div>
          <div v-if="!recentOrders.length" class="txt-gray">ยังไม่มีข้อมูล</div>
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <tbody>
              <tr v-for="o in recentOrders" :key="o._id" style="border-bottom:1px solid #f0f0f0">
                <td style="padding:8px 0">
                  <div style="font-weight:500">#{{ o._id.slice(-6) }}</div>
                  <div style="color:#999;font-size:11px">{{ fmt(o.createdAt) }}</div>
                </td>
                <td style="padding:8px 0;text-align:right">
                  <div style="font-weight:600">฿{{ o.totalAmount.toLocaleString() }}</div>
                  <span :class="['badge', `badge-${o.status}`]" style="font-size:11px">{{ o.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
