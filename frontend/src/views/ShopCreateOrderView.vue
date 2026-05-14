<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/base'
import { useOrderStore } from '../stores/order.store'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()

const shopId = route.params.id as string
const shop = ref<any>(null)
const products = ref<any[]>([])
const step = ref(1)

// Step 1
const recipient = ref({ name: '', phone: '', address: '' })
const phoneError = ref('')

// Step 2
const orderItems = ref<any[]>([])

// Step 3
const paymentMethod = ref<'transfer' | 'cod'>('cod')
const submitting = ref(false)
const pageError = ref('')

onMounted(async () => {
  try {
    const shopRes = await api.get(`/shops/${shopId}`)
    shop.value = shopRes.data
    const productsRes = await api.get(`/products/shop/${shopId}`)
    products.value = productsRes.data
  } catch (e: any) {
    pageError.value = e.response?.data?.message || 'โหลดข้อมูลไม่ได้'
  }
})

function validatePhone(phone: string) {
  if (!phone) return 'กรุณากรอกเบอร์โทร'
  if (!/^0/.test(phone)) return 'ต้องขึ้นต้นด้วย 0'
  if (!/^\d+$/.test(phone)) return 'ตัวเลขเท่านั้น'
  if (phone.length < 9 || phone.length > 10) return '9-10 หลัก'
  return ''
}

function onPhoneInput(e: Event) {
  const digits = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 10)
    ; (e.target as HTMLInputElement).value = digits
  recipient.value.phone = digits
  phoneError.value = validatePhone(digits)
}

const canGoStep2 = computed(() =>
  recipient.value.name.trim() &&
  recipient.value.phone &&
  recipient.value.address.trim() &&
  !phoneError.value
)

function goStep2() {
  phoneError.value = validatePhone(recipient.value.phone)
  if (!canGoStep2.value) return
  step.value = 2
}

function toggleProduct(product: any) {
  const idx = orderItems.value.findIndex(i => i.productId === product._id)
  if (idx === -1) {
    orderItems.value.push({ productId: product._id, name: product.name, price: product.price, quantity: 1 })
  } else {
    orderItems.value.splice(idx, 1)
  }
}

function isSelected(productId: string) {
  return orderItems.value.some(i => i.productId === productId)
}

function changeQty(productId: string, delta: number) {
  const item = orderItems.value.find(i => i.productId === productId)
  if (!item) return
  item.quantity = Math.max(1, item.quantity + delta)
}

const totalAmount = computed(() =>
  orderItems.value.reduce((sum, i) => sum + i.price * i.quantity, 0)
)

const canGoStep3 = computed(() => orderItems.value.length > 0)

async function submitOrder() {
  submitting.value = true
  try {
    const shippingAddress = `ผู้รับ: ${recipient.value.name} | โทร: ${recipient.value.phone} | ที่อยู่: ${recipient.value.address}`
    const note = `ชำระเงิน: ${paymentMethod.value === 'transfer' ? 'โอนเงิน' : 'เก็บเงินปลายทาง'}`

    await orderStore.createOrder({
      shopId,
      items: orderItems.value.map(i => ({ productId: i.productId, quantity: i.quantity })),
      shippingAddress,
      note,
    })
    router.push(`/shops/${shopId}/orders`)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page">
    <p v-if="pageError" class="txt-error">{{ pageError }}</p>

    <!-- Header -->
    <div class="section-header" style="margin-bottom:24px">
      <div class="back-header">
        <button class="btn-back" @click="step > 1 ? step-- : router.push(`/shops/${shopId}/orders`)">← กลับ</button>
        <div>
          <h1 class="page-title">สร้างคำสั่งซื้อ</h1>
          <p class="page-sub">{{ shop?.name }}</p>
        </div>
      </div>
      <!-- Step indicator -->
      <div class="steps">
        <div :class="['step', step >= 1 ? 'step-on' : '']">1</div>
        <div class="step-line"></div>
        <div :class="['step', step >= 2 ? 'step-on' : '']">2</div>
        <div class="step-line"></div>
        <div :class="['step', step >= 3 ? 'step-on' : '']">3</div>
      </div>
    </div>

    <!-- ── STEP 1: ข้อมูลการจัดส่ง ── -->
    <div v-if="step === 1">
      <div class="form-box">
        <h3>ข้อมูลผู้ส่ง</h3>
        <div class="sender-box">
          <div class="srow"><span class="slabel">ร้าน</span><span>{{ shop?.name }}</span></div>
          <div class="srow"><span class="slabel">ที่อยู่</span><span>{{ shop?.address || '-' }}</span></div>
        </div>
      </div>

      <div class="form-box">
        <h3>ที่อยู่ผู้รับ</h3>
        <div class="form-group">
          <label>ชื่อผู้รับ</label>
          <input v-model="recipient.name" type="text" placeholder="ชื่อ-นามสกุล ผู้รับ" />
        </div>
        <div class="form-group">
          <label>เบอร์โทรศัพท์</label>
          <input :value="recipient.phone" type="text" placeholder="0812345678" maxlength="10" inputmode="numeric"
            :style="phoneError ? 'border-color:#ef4444' : ''" @input="onPhoneInput" />
          <div v-if="phoneError" style="color:#ef4444;font-size:11px;margin-top:3px">{{ phoneError }}</div>
        </div>
        <div class="form-group">
          <label>รายละเอียดที่อยู่</label>
          <textarea v-model="recipient.address" rows="3" placeholder="บ้านเลขที่ ถนน อำเภอ จังหวัด รหัสไปรษณีย์"
            style="width:100%;padding:7px 10px;border:1px solid #d1d5db;border-radius:4px;font-size:13px;resize:vertical;outline:none"></textarea>
        </div>
        <div class="form-actions" style="justify-content:flex-end">
          <button class="btn-create-shop" :disabled="!canGoStep2" @click="goStep2">
            ถัดไป: เลือกสินค้า →
          </button>
        </div>
      </div>
    </div>

    <!-- ── STEP 2: เลือกสินค้า ── -->
    <div v-if="step === 2">
      <div class="form-box">
        <h3>เลือกสินค้า</h3>
        <p v-if="products.length === 0" class="txt-gray">ไม่มีสินค้าในร้านนี้</p>
        <div class="product-grid">
          <div v-for="product in products" :key="product._id"
            :class="['product-card', isSelected(product._id) ? 'product-card-on' : '']" @click="toggleProduct(product)">
            <div class="product-name">{{ product.name }}</div>
            <div class="product-price">฿{{ product.price.toLocaleString() }}</div>
            <div class="product-stock" :class="product.stock > 0 ? 'stock-ok' : 'stock-out'">
              สต็อก {{ product.stock }} ชิ้น
            </div>
            <div v-if="isSelected(product._id)" class="product-check">✓</div>
          </div>
        </div>
      </div>

      <!-- รายการที่เลือก -->
      <div v-if="orderItems.length > 0" class="form-box">
        <h3>รายการที่เลือก</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>สินค้า</th>
              <th>ราคา/ชิ้น</th>
              <th>จำนวน</th>
              <th>รวม</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in orderItems" :key="item.productId">
              <td>{{ item.name }}</td>
              <td>฿{{ item.price.toLocaleString() }}</td>
              <td>
                <div class="qty-box">
                  <button @click="changeQty(item.productId, -1)">−</button>
                  <span>{{ item.quantity }}</span>
                  <button @click="changeQty(item.productId, 1)">+</button>
                </div>
              </td>
              <td>฿{{ (item.price * item.quantity).toLocaleString() }}</td>
              <td>
                <button class="btn-remove"
                  @click="orderItems.splice(orderItems.findIndex(i => i.productId === item.productId), 1)">✕</button>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="order-sum">ยอดรวม: <strong>฿{{ totalAmount.toLocaleString() }}</strong></div>
      </div>

      <div style="display:flex;justify-content:flex-end">
        <button class="btn-create-shop" :disabled="!canGoStep3" @click="step = 3">
          ถัดไป: ชำระเงิน →
        </button>
      </div>
    </div>

    <!-- ── STEP 3: ชำระเงิน ── -->
    <div v-if="step === 3">
      <div class="form-box">
        <h3>วิธีชำระเงิน</h3>
        <div class="pay-list">
          <label :class="['pay-item', paymentMethod === 'transfer' ? 'pay-item-on' : '']">
            <input type="radio" v-model="paymentMethod" value="transfer" style="display:none" />
            <div class="pay-label">โอนเงิน</div>
          </label>
          <label :class="['pay-item', paymentMethod === 'cod' ? 'pay-item-on' : '']">
            <input type="radio" v-model="paymentMethod" value="cod" style="display:none" />
            <div class="pay-icon"></div>
            <div class="pay-label">เก็บเงินปลายทาง</div>
          </label>
        </div>
      </div>

      <!-- สรุปคำสั่งซื้อ -->
      <div class="form-box">
        <h3> สรุปคำสั่งซื้อ</h3>
        <div class="summary">
          <div class="sum-label">ผู้รับ</div>
          <div>{{ recipient.name }} | {{ recipient.phone }}</div>
          <div style="color:#6b7280;font-size:12px">{{ recipient.address }}</div>
        </div>
        <div class="summary" style="margin-top:12px">
          <div class="sum-label">รายการสินค้า</div>
          <div v-for="item in orderItems" :key="item.productId" class="sum-item">
            <span>{{ item.name }} ×{{ item.quantity }}</span>
            <span>฿{{ (item.price * item.quantity).toLocaleString() }}</span>
          </div>
        </div>
        <div class="sum-total">
          <span>ยอดรวมทั้งหมด</span><strong>฿{{ totalAmount.toLocaleString() }}</strong>
        </div>
        <div style="margin-top:8px;font-size:13px;color:#6b7280">
          ชำระเงิน: {{ paymentMethod === 'transfer' ? 'โอนเงิน' : 'เก็บเงินปลายทาง' }}
        </div>
      </div>

      <div style="display:flex;justify-content:flex-end">
        <button class="btn-create-shop" :disabled="submitting" @click="submitOrder">
          {{ submitting ? 'กำลังสร้าง...' : '✓ ยืนยันคำสั่งซื้อ' }}
        </button>
      </div>
    </div>

  </div>
</template>
