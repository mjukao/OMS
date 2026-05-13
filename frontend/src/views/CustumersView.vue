<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useShopStore } from '../stores/shop.store'
import { useUserStore } from '../stores/user.store'
import type { Customer } from '../types/user.type'
import api from '../services/api'

const shopStore = useShopStore()
const userStore = useUserStore()

const selectedShopId = ref('')
const expandedId = ref<string | null>(null)
const loading = ref(false)
const customers = ref<Customer[]>([])

onMounted(async () => {
    await shopStore.fetchAll()
    await load() // โหลดทั้งหมดตั้งแต่เปิดหน้า
})

async function load() {
    loading.value = true
    expandedId.value = null
    try {
        if (selectedShopId.value) {
            // เลือกร้านเดียว
            await userStore.fetchCustomers(selectedShopId.value)
            customers.value = userStore.customers
        } else {
            // ไม่ได้เลือกร้าน → loop ดึงทุกร้านแล้วรวมกัน
            const results = await Promise.all(
                shopStore.shops.map((shop) =>
                    api.get(`/shops/${shop._id}/customers`).then((r) => r.data as Customer[])
                )
            )
            // รวม customers จากทุกร้าน merge by user._id
            const map = new Map<string, Customer>()
            for (const shopCustomers of results) {
                for (const c of shopCustomers) {
                    const uid = c.user._id
                    if (!map.has(uid)) {
                        map.set(uid, { ...c })
                    } else {
                        const existing = map.get(uid)!
                        existing.orderCount += c.orderCount
                        existing.totalSpent += c.totalSpent
                        existing.orders = [...existing.orders, ...c.orders]
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

function toggle(uid: string) {
    expandedId.value = expandedId.value === uid ? null : uid
}

const totalOrders = computed(() =>
    customers.value.reduce((s, c) => s + c.orderCount, 0)
)
const totalRevenue = computed(() =>
    customers.value.reduce((s, c) => s + c.totalSpent, 0)
)

function statusBadge(status: string) {
    const map: Record<string, string> = {
        pending: 'badge-red',
        confirmed: 'badge-green',
        shipped: 'badge-green',
        delivered: 'badge-green',
        cancelled: 'badge-red',
    }
    return map[status] ?? ''
}

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
            <h1>ลูกค้า</h1>
            <select v-model="selectedShopId" @change="load"
                style="padding:7px 12px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;background:#fff">
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
            <div style="display:flex;gap:12px;margin-bottom:16px">
                <div class="form-box" style="flex:1;padding:14px;margin:0">
                    <div style="font-size:12px;color:#6b7280">ลูกค้าทั้งหมด</div>
                    <div style="font-size:22px;font-weight:600">{{ customers.length }}</div>
                </div>
                <div class="form-box" style="flex:1;padding:14px;margin:0">
                    <div style="font-size:12px;color:#6b7280">ออเดอร์ทั้งหมด</div>
                    <div style="font-size:22px;font-weight:600">{{ totalOrders }}</div>
                </div>
                <div class="form-box" style="flex:1;padding:14px;margin:0">
                    <div style="font-size:12px;color:#6b7280">ยอดขายรวม</div>
                    <div style="font-size:22px;font-weight:600">฿{{ totalRevenue.toLocaleString() }}</div>
                </div>
            </div>

            <!-- Customer Table -->
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ลูกค้า</th>
                        <th>เบอร์โทร</th>
                        <th>จำนวน Order</th>
                        <th>ยอดรวม</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <template v-for="c in customers" :key="c.user._id">
                        <tr :class="{ 'row-active': expandedId === c.user._id }" style="cursor:pointer"
                            @click="toggle(c.user._id)">
                            <td>
                                <div style="font-weight:500">
                                    {{ c.user.firstName ? `${c.user.firstName} ${c.user.lastName}` : c.user.name }}
                                </div>
                                <div style="font-size:12px;color:#6b7280">{{ c.user.email }}</div>
                            </td>
                            <td style="font-size:13px">{{ c.user.phone ?? '-' }}</td>
                            <td>{{ c.orderCount }} ครั้ง</td>
                            <td style="font-weight:500">฿{{ c.totalSpent.toLocaleString() }}</td>
                            <td style="color:#6b7280;font-size:12px">{{ expandedId === c.user._id ? '▲' : '▼' }}</td>
                        </tr>

                        <!-- Orders expand -->
                        <tr v-if="expandedId === c.user._id">
                            <td colspan="5" style="padding:0;background:#f9fafb">
                                <table style="width:100%;font-size:12px;border-collapse:collapse">
                                    <thead>
                                        <tr style="background:#f3f4f6">
                                            <th style="padding:6px 14px;text-align:left;color:#6b7280;font-weight:500">
                                                สินค้า</th>
                                            <th style="padding:6px 14px;text-align:left;color:#6b7280;font-weight:500">
                                                ราคารวม</th>
                                            <th style="padding:6px 14px;text-align:left;color:#6b7280;font-weight:500">
                                                Status</th>
                                            <th style="padding:6px 14px;text-align:left;color:#6b7280;font-weight:500">
                                                วันที่สั่ง</th>
                                            <th style="padding:6px 14px;text-align:left;color:#6b7280;font-weight:500">
                                                ร้าน</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="order in c.orders" :key="order._id"
                                            style="border-top:1px solid #e5e7eb">
                                            <td style="padding:8px 14px">
                                                <div v-for="item in order.items" :key="item.productName">
                                                    {{ item.productName }}
                                                    <span style="color:#9ca3af">×{{ item.quantity }}</span>
                                                </div>
                                            </td>
                                            <td style="padding:8px 14px;font-weight:500">฿{{
                                                order.totalAmount.toLocaleString() }}</td>
                                            <td style="padding:8px 14px">
                                                <span :class="['badge', `badge-${order.status}`]">{{ order.status
                                                    }}</span>
                                            </td>
                                            <td style="padding:8px 14px;color:#6b7280">{{ formatDate(order.createdAt) }}
                                            </td>
                                            <td style="padding:8px 14px;color:#6b7280">{{ order.shopName }}</td>
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
