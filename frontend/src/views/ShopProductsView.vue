<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/base'

const route = useRoute()
const router = useRouter()

const shopId = route.params.id as string
const shop = ref<any>(null)
const products = ref<any[]>([])
const loading = ref(true)
const pageError = ref('')

const showProductForm = ref(false)
const editProduct = ref<any>(null)
const productForm = ref({ name: '', description: '', price: 0, stock: 0 })

onMounted(async () => {
  try {
    const shopRes = await api.get(`/shops/${shopId}`)
    shop.value = shopRes.data
    const productsRes = await api.get(`/products/shop/${shopId}`)
    products.value = productsRes.data
  } catch (e: any) {
    pageError.value = e.response?.data?.message || 'โหลดข้อมูลไม่ได้'
  } finally {
    loading.value = false
  }
})

async function refreshProducts() {
  const res = await api.get(`/products/shop/${shopId}`)
  products.value = res.data
}

function openCreateProduct() {
  editProduct.value = null
  productForm.value = { name: '', description: '', price: 0, stock: 0 }
  showProductForm.value = true
}

function openEditProduct(product: any) {
  editProduct.value = product
  productForm.value = {
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
  }
  showProductForm.value = true
}

async function handleProductSubmit() {
  if (!productForm.value.name) return
  if (editProduct.value) {
    await api.patch(`/products/${editProduct.value._id}`, productForm.value)
  } else {
    await api.post('/products', {
      ...productForm.value,
      shopId,
    })
  }
  showProductForm.value = false
  refreshProducts()
}

async function handleProductDelete(id: string) {
  if (confirm('ยืนยันลบสินค้า?')) {
    await api.delete(`/products/${id}`)
    refreshProducts()
  }
}
</script>

<template>
  <div class="page">
    <p v-if="pageError" class="txt-error">{{ pageError }}</p>
    <div v-if="loading" class="txt-gray">กำลังโหลด...</div>

    <template v-else>
      <!-- Header -->
      <div class="section-header">
        <div class="back-header">
          <button class="btn-back" @click="router.push('/shops')">← กลับ</button>
          <div>
            <h1 class="page-title">{{ shop?.name }}</h1>
            <p v-if="shop?.description" class="page-sub">{{ shop.description }}</p>
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn-orders" @click="router.push(`/shops/${shopId}/orders`)"> คำสั่งซื้อ </button>
          <button class="btn-create-shop" @click="openCreateProduct">+ เพิ่มสินค้า</button>
        </div>
      </div>

      <!-- Product Form -->
      <div v-if="showProductForm" class="form-box">
        <h3>{{ editProduct ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่' }}</h3>
        <div class="form-group">
          <label>ชื่อสินค้า</label>
          <input v-model="productForm.name" placeholder="ชื่อสินค้า" required />
        </div>
        <div class="form-group">
          <label>รายละเอียด</label>
          <input v-model="productForm.description" placeholder="รายละเอียด" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>ราคา (บาท)</label>
            <input type="number" v-model.number="productForm.price" min="0" />
          </div>
          <div class="form-group">
            <label>สต็อก</label>
            <input type="number" v-model.number="productForm.stock" min="0" />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-save" @click="handleProductSubmit">
            {{ editProduct ? 'บันทึก' : 'เพิ่มสินค้า' }}
          </button>
          <button class="btn-cancel" @click="showProductForm = false">ยกเลิก</button>
        </div>
      </div>

      <!-- Empty -->
      <p v-if="products.length === 0 && !showProductForm" class="txt-gray">
        ยังไม่มีสินค้าในร้านนี้
      </p>

      <!-- Table -->
      <table v-if="products.length > 0" class="data-table">
        <thead>
          <tr>
            <th>ชื่อสินค้า</th>
            <th>รายละเอียด</th>
            <th>ราคา</th>
            <th>สต็อก</th>
            <th>จัดการ</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product._id">
            <td>{{ product.name }}</td>
            <td>{{ product.description || '-' }}</td>
            <td>฿{{ product.price.toLocaleString() }}</td>
            <td>
              <span :class="product.stock > 0 ? 'stock-ok' : 'stock-out'">
                {{ product.stock }} ชิ้น
              </span>
            </td>
            <td>
              <button class="btn-edit" @click="openEditProduct(product)">แก้ไข</button>
              <button class="btn-del" @click="handleProductDelete(product._id)">ลบ</button>
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>
