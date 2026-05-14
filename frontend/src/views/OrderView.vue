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

const filterStatus = ref('');
const showModal = ref(false);
const router = useRouter()
//Order form
const form = ref({
    shopId: '',
    items: [] as { productId: string; quantity: number }[],
    shippingAddress: '',
    note: '',
});

const shopProducts = ref<any[]>([]);
const selectedProductId = ref('');
const selectedQty = ref(1);

// Address form modal
const showAddrModal = ref(false);
const addrPhoneError = ref('');
const addrForm = ref({
    label: '',
    fullName: '',
    phone: '',
    address: '',
    isDefault: false,
});

async function load() {
    await orderStore.fetchAll({ status: filterStatus.value || undefined });
}

onMounted(async () => {
    await Promise.all([load(), shopStore.fetchAll(), userStore.fetchProfile()]);
});

function openCreate() {
    if (!userStore.profile?.phone) {
        alert('กรุณากรอกเบอร์โทรศัพท์ในหน้าโปรไฟล์ก่อนสั่งซื้อ')
        router.push('/profile')
        return
    }
    form.value = { shopId: '', items: [], shippingAddress: '', note: '' };
    const defaultAddr = userStore.profile?.addresses?.find((a) => a.isDefault);
    if (defaultAddr) form.value.shippingAddress = defaultAddr.address;
    shopProducts.value = [];
    selectedProductId.value = '';
    selectedQty.value = 1;
    showModal.value = true;
}

async function loadProducts() {
    if (!form.value.shopId) return;
    const { data } = await api.get(`/products/shop/${form.value.shopId}`);
    shopProducts.value = data;
    form.value.items = [];
}

function addItem() {
    if (!selectedProductId.value || selectedQty.value < 1) return;
    const exists = form.value.items.findIndex(
        (i) => i.productId === selectedProductId.value,
    );
    if (exists !== -1) {
        form.value.items[exists]!.quantity += selectedQty.value;
    } else {
        form.value.items.push({
            productId: selectedProductId.value,
            quantity: selectedQty.value,
        });
    }
    selectedProductId.value = '';
    selectedQty.value = 1;
}

function removeItem(index: number) {
    form.value.items.splice(index, 1);
}

function selectAddress(address: string) {
    form.value.shippingAddress = address;
}

// Address modal
function openAddrModal() {
    addrForm.value = { label: '', fullName: '', phone: '', address: '', isDefault: false };
    addrPhoneError.value = '';
    showAddrModal.value = true;
}

function validatePhone(phone: string): string {
    if (!phone) return 'กรุณากรอกเบอร์โทร'
    if (!/^0/.test(phone)) return 'เบอร์โทรต้องขึ้นต้นด้วย 0'
    if (!/^\d+$/.test(phone)) return 'เบอร์โทรต้องเป็นตัวเลขเท่านั้น'
    if (phone.length < 9 || phone.length > 10) return 'เบอร์โทรต้องมี 9 หรือ 10 หลัก'
    return ''
}

function onAddrPhoneInput(e: Event) {
    const digits = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 10);
    (e.target as HTMLInputElement).value = digits;
    addrForm.value.phone = digits;
    addrPhoneError.value = validatePhone(digits);
}

const canSaveAddr = computed(() =>
    addrForm.value.label &&
    addrForm.value.fullName &&
    addrForm.value.phone &&
    addrForm.value.address &&
    !addrPhoneError.value
)

async function saveAddr() {
    addrPhoneError.value = validatePhone(addrForm.value.phone);
    if (addrPhoneError.value) return;
    await userStore.addAddress(addrForm.value);
    // auto-select ที่อยู่ที่เพิ่งสร้าง
    form.value.shippingAddress = addrForm.value.address;
    showAddrModal.value = false;
}

// Order 
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
    try {
        await orderStore.createOrder(form.value);
        showModal.value = false;
        await load();
    } catch (err) {
        console.error('[submitOrder] error:', err);
    }
}

async function changeStatus(id: string, event: Event) {
    const status = (event.target as HTMLSelectElement).value;
    await orderStore.updateOrder(id, { status: status as any });
    await load();
}

async function cancel(id: string) {
    if (!confirm('ยืนยันการยกเลิก order?')) return;
    await orderStore.cancelOrder(id);
    await load();
}

function shopName(shop: any) {
    return typeof shop === 'object' ? shop?.name : shop;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('th-TH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
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
                        <span :class="['badge', `badge-${order.status}`]">{{ order.status }}</span>
                    </td>
                    <td>{{ formatDate(order.createdAt) }}</td>
                    <td>
                        <div class="action-btns">
                            <select :value="order.status" :disabled="['cancelled', 'delivered'].includes(order.status)"
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

        <!-- ── Modal สร้าง Order ── -->
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
                        <button class="btn-add" @click="addItem">+ เพิ่ม</button>
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
                            <td>
                                <button class="btn-sm btn-sm-delete" style="padding:2px 6px"
                                    @click="removeItem(i)">✕</button>
                            </td>
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
                    <!-- ← ปุ่มสร้างที่อยู่ใหม่ เปิด modal ซ้อน -->
                    <button class="btn-sm btn-sm-view" style="width:100%;margin-top:4px" @click="openAddrModal">
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

        <!-- ── Modal สร้างที่อยู่ใหม่ (ซ้อนบน modal order) ── -->
        <div v-if="showAddrModal" class="modal-backdrop" style="z-index:200" @click.self="showAddrModal = false">
            <div class="modal" style="z-index:201">
                <h2>สร้างที่อยู่จัดส่งใหม่</h2>

                <div class="form-group">
                    <label>ชื่อที่อยู่ (เช่น บ้าน, ที่ทำงาน)</label>
                    <input v-model="addrForm.label" type="text" placeholder="บ้าน" style="width:100%" />
                </div>
                <div class="form-group">
                    <label>ชื่อผู้รับ</label>
                    <input v-model="addrForm.fullName" type="text" placeholder="ชื่อผู้รับ" style="width:100%" />
                </div>
                <div class="form-group">
                    <label>เบอร์โทร</label>
                    <input :value="addrForm.phone" type="text" placeholder="0812345678" maxlength="10"
                        inputmode="numeric" :style="addrPhoneError ? 'border-color:#ef4444;width:100%' : 'width:100%'"
                        @input="onAddrPhoneInput($event)" />
                    <div v-if="addrPhoneError" class="txt-error" style="margin-top:4px;font-size:12px">{{ addrPhoneError
                        }}</div>
                    <div style="font-size:11px;color:#9ca3af;margin-top:3px">ต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก</div>
                </div>
                <div class="form-group">
                    <label>ที่อยู่</label>
                    <textarea v-model="addrForm.address" rows="3"
                        placeholder="บ้านเลขที่ ถนน อำเภอ จังหวัด รหัสไปรษณีย์"
                        style="width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:4px;font-size:13px;resize:vertical">
                    </textarea>
                </div>
                <div class="form-group" style="display:flex;align-items:center;gap:8px">
                    <input id="addrDefault" v-model="addrForm.isDefault" type="checkbox" />
                    <label for="addrDefault" style="margin:0;font-size:13px;color:#374151">ตั้งเป็นที่อยู่หลัก</label>
                </div>

                <div class="form-actions" style="justify-content:flex-end;gap:8px">
                    <button class="btn-cancel" @click="showAddrModal = false">ยกเลิก</button>
                    <button class="btn-save" :disabled="!canSaveAddr || userStore.loading" @click="saveAddr">
                        {{ userStore.loading ? 'กำลังบันทึก...' : 'บันทึกที่อยู่' }}
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>
