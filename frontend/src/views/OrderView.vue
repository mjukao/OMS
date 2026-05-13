<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import api from '../services/api';
import { useOrderStore } from '../stores/order.store';
import { useShopStore } from '../stores/shop.store';
import { useUserStore } from '../stores/user.store';
import { useRouter } from 'vue-router';
const orderStore = useOrderStore();
const shopStore = useShopStore();
const userStore = useUserStore();
const router = useRouter()
const filterStatus = ref('');
const showModal = ref(false);

const form = ref({
    shopId: '',
    items: [] as { productId: string; quantity: number }[],
    shippingAddress: '',
    note: '',
});

const shopProducts = ref<any[]>([]);
const selectedProductId = ref('');
const selectedQty = ref(1);

async function load() {
    console.log('[load] fetchAll with status:', filterStatus.value || 'ALL');
    await orderStore.fetchAll({ status: filterStatus.value || undefined });
    console.log('[load] orders loaded:', orderStore.orders.length, 'orders');
}

onMounted(async () => {
    console.log('[onMounted] initializing OrderView');
    await Promise.all([load(), shopStore.fetchAll(), userStore.fetchProfile()]);
    console.log('[onMounted] done — shops:', shopStore.shops.length, '| profile:', userStore.profile?.email);
});

function openCreate() {
    console.log('[openCreate] opening create order modal');
    form.value = { shopId: '', items: [], shippingAddress: '', note: '' };
    const defaultAddr = userStore.profile?.addresses?.find((a) => a.isDefault);
    if (defaultAddr) {
        form.value.shippingAddress = defaultAddr.address;
        console.log('[openCreate] pre-filled default address:', defaultAddr.label, '-', defaultAddr.address);
    } else {
        console.log('[openCreate] no default address found');
    }
    shopProducts.value = [];
    selectedProductId.value = '';
    selectedQty.value = 1;
    showModal.value = true;
}

async function loadProducts() {
    if (!form.value.shopId) {
        console.log('[loadProducts] no shopId selected, skip');
        return;
    }
    console.log('[loadProducts] fetching products for shopId:', form.value.shopId);
    const { data } = await api.get(`/products/shop/${form.value.shopId}`);
    shopProducts.value = data;
    form.value.items = [];
    console.log('[loadProducts] products loaded:', data.length, 'items', data);
}

function addItem() {
    if (!selectedProductId.value || selectedQty.value < 1) {
        console.log('[addItem] invalid input — productId:', selectedProductId.value, 'qty:', selectedQty.value);
        return;
    }
    const exists = form.value.items.findIndex(
        (i) => i.productId === selectedProductId.value,
    );
    if (exists !== -1) {
        form.value.items[exists]!.quantity += selectedQty.value;
        console.log('[addItem] updated existing item at index', exists, '— new qty:', form.value.items[exists]!.quantity);
    } else {
        form.value.items.push({
            productId: selectedProductId.value,
            quantity: selectedQty.value,
        });
        console.log('[addItem] added new item — productId:', selectedProductId.value, 'qty:', selectedQty.value);
    }
    console.log('[addItem] current items:', JSON.parse(JSON.stringify(form.value.items)));
    selectedProductId.value = '';
    selectedQty.value = 1;
}

function removeItem(index: number) {
    const removed = form.value.items[index];
    console.log('[removeItem] removing index', index, '— productId:', removed?.productId);
    form.value.items.splice(index, 1);
    console.log('[removeItem] items remaining:', form.value.items.length);
}

function selectAddress(address: string) {
    console.log('[selectAddress] selected:', address);
    form.value.shippingAddress = address;
}

const formItemsPreview = computed(() =>
    form.value.items.map((item) => {
        const product = shopProducts.value.find((p) => p._id === item.productId);
        return {
            name: product?.name ?? item.productId,
            price: product?.price ?? 0,
            qty: item.quantity,
        };
    }),
);

const canSubmit = computed(
    () =>
        form.value.shopId &&
        form.value.items.length > 0 &&
        form.value.shippingAddress.trim(),
);

async function submitOrder() {
    console.log('[submitOrder] submitting order with payload:', JSON.parse(JSON.stringify(form.value)));
    try {
        await orderStore.createOrder(form.value);
        console.log('[submitOrder] order created successfully');
        showModal.value = false;
        await load();
    } catch (err) {
        console.error('[submitOrder] error creating order:', err);
    }
}

async function changeStatus(id: string, event: Event) {
    const status = (event.target as HTMLSelectElement).value;
    console.log('[changeStatus] orderId:', id, '→ status:', status);
    await orderStore.updateOrder(id, { status: status as any });
    console.log('[changeStatus] update done, reloading...');
    await load();
}

async function cancel(id: string) {
    console.log('[cancel] requested for orderId:', id);
    if (!confirm('ยืนยันการยกเลิก order?')) {
        console.log('[cancel] user cancelled confirmation');
        return;
    }
    console.log('[cancel] confirmed — cancelling orderId:', id);
    await orderStore.cancelOrder(id);
    console.log('[cancel] cancelled successfully, reloading...');
    await load();
}

function shopName(shop: any) {
    const name = typeof shop === 'object' ? shop?.name : shop;
    console.log('[shopName] shop:', shop, '→ name:', name);
    return name;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('th-TH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}
function goToProfile() {
    showModal.value = false
    router.push('/profile')
}
</script>

<template>
    <div class="page">

        <div class="section-header">
            <h1>Orders</h1>
            <button class="btn-add" @click="openCreate">+ สร้าง Order</button>
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

        <p v-if="orderStore.error" class="txt-error">{{ orderStore.error }}</p>
        <div v-if="orderStore.loading" class="loading">กำลังโหลด...</div>

        <table v-else class="data-table">
            <thead>
                <tr>
                    <th>Order ID</th>
                    <th>ร้าน</th>
                    <th>รายการสินค้า</th>
                    <th>ยอดรวม</th>
                    <th>Status</th>
                    <th>วันที่สั่ง</th>
                    <th>จัดการ</th>
                </tr>
            </thead>
            <tbody>
                <tr v-if="orderStore.orders.length === 0">
                    <td colspan="7" class="empty">ไม่มี order</td>
                </tr>
                <tr v-for="order in orderStore.orders" :key="order._id">
                    <td>{{ order._id.slice(-6).toUpperCase() }}</td>
                    <td>{{ shopName(order.shop) }}</td>
                    <td>
                        <ul class="item-list">
                            <li v-for="item in order.items" :key="item._id">
                                {{ item.productName }}
                                <span class="item-meta">×{{ item.quantity }} (฿{{ item.unitPrice?.toLocaleString()
                                    }})</span>
                            </li>
                        </ul>
                    </td>
                    <td>฿{{ order.totalAmount.toLocaleString() }}</td>
                    <td>
                        <span :class="['badge', `badge-${order.status}`]">
                            {{ order.status }}
                        </span>
                    </td>
                    <td>{{ formatDate(order.createdAt) }}</td>
                    <td>
                        <div class="action-btns">
                            <!-- ← ใช้ v-model + @change ส่ง event ทั้งก้อน -->
                            <select v-model="order.status" :disabled="['cancelled', 'delivered'].includes(order.status)"
                                @change="changeStatus(order._id, $event)">
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                            </select>
                            <button class="btn-sm btn-sm-delete"
                                :disabled="['cancelled', 'delivered'].includes(order.status)"
                                @click="cancel(order._id)">
                                ยกเลิก
                            </button>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>

        <!-- Modal -->
        <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
            <div class="modal">
                <h2>สร้าง Order ใหม่</h2>

                <div class="form-group">
                    <label>ร้านค้า</label>
                    <select v-model="form.shopId" @change="loadProducts" style="width:100%">
                        <option value="">-- เลือกร้าน --</option>
                        <option v-for="shop in shopStore.shops" :key="shop._id" :value="shop._id">
                            {{ shop.name }}
                        </option>
                    </select>
                </div>

                <div class="form-group">
                    <label>เพิ่มสินค้า</label>
                    <div class="add-item-row">
                        <select v-model="selectedProductId" style="flex:1;min-width:0">
                            <option value="">-- เลือกสินค้า --</option>
                            <option v-for="p in shopProducts" :key="p._id" :value="p._id">
                                {{ p.name }} (฿{{ p.price }} | stock: {{ p.stock }})
                            </option>
                        </select>
                        <input v-model.number="selectedQty" type="number" min="1" style="width:72px;flex-shrink:0" />
                        <button class="btn-add" @click="addItem">confirm สินค้า</button>
                    </div>
                </div>

                <table v-if="form.items.length" class="data-table" style="font-size:12px">
                    <thead>
                        <tr>
                            <th>สินค้า</th>
                            <th>ราคา</th>
                            <th>จำนวน</th>
                            <th>รวม</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, i) in formItemsPreview" :key="i">
                            <td>{{ item.name }}</td>
                            <td>฿{{ item.price.toLocaleString() }}</td>
                            <td>{{ item.qty }}</td>
                            <td>฿{{ (item.price * item.qty).toLocaleString() }}</td>
                            <td><button class="btn-sm btn-sm-delete" style="padding:2px 6px"
                                    @click="removeItem(i)">✕</button></td>
                        </tr>
                    </tbody>
                </table>

                <div class="form-group">
                    <label>ที่อยู่จัดส่ง</label>
                    <div v-if="userStore.profile?.addresses?.length" style="margin-bottom:8px">
                        <div style="font-size:12px;color:#6b7280;margin-bottom:6px">เลือกจากที่อยู่ที่บันทึกไว้:</div>
                        <div v-for="addr in userStore.profile.addresses" :key="addr._id"
                            :class="['addr-select-card', form.shippingAddress === addr.address ? 'addr-selected' : '']"
                            @click="selectAddress(addr.address)">
                            <div style="display:flex;justify-content:space-between;align-items:center">
                                <div>
                                    <span style="font-weight:500;font-size:12px">{{ addr.label }}</span>
                                    <span v-if="addr.isDefault" class="badge badge-green"
                                        style="margin-left:6px;font-size:10px">หลัก</span>
                                </div>
                                <span v-if="form.shippingAddress === addr.address"
                                    style="color:#16a34a;font-size:12px">✓</span>
                            </div>
                            <div style="font-size:12px;color:#374151;margin-top:2px">{{ addr.fullName }} | {{ addr.phone
                                }}</div>
                            <div style="font-size:11px;color:#6b7280;margin-top:1px">{{ addr.address }}</div>
                        </div>
                    </div>
                    <button class="btn-sm btn-sm-view" style="width:100%;margin-top:4px" @click="goToProfile">
                        + สร้างที่อยู่จัดส่งใหม่
                    </button>
                </div>

                <div class="form-group">
                    <label>หมายเหตุ (optional)</label>
                    <input v-model="form.note" type="text" placeholder="หมายเหตุ" style="width:100%" />
                </div>

                <div class="form-actions" style="justify-content:flex-end;gap:8px">
                    <button class="btn-cancel" @click="showModal = false">ยกเลิก</button>
                    <button class="btn-save" :disabled="!canSubmit || orderStore.loading" @click="submitOrder">
                        {{ orderStore.loading ? 'กำลังสร้าง...' : 'สร้าง Order' }}
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>
