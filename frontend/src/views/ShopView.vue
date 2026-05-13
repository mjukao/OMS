<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { useShopStore } from '../stores/shop.store'

const shopStore = useShopStore()

const selectedShop = ref<any>(null)
const products = ref<any[]>([])
const showShopForm = ref(false)
const editShop = ref<any>(null)
const shopForm = ref({ name: '', address: '', description: '' })
const showProductForm = ref(false)
const editProduct = ref<any>(null)
const productForm = ref({ name: '', description: '', price: 0, stock: 0 })

// search
const search = ref('')
let searchTimer: any = null

onMounted(() => shopStore.fetchAll())

// debounce → รอ 500ms แล้วค่อยยิง
watch(search, (val) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    shopStore.fetchAll(val)
  }, 500)
})

function openCreateShop() {
  editShop.value = null
  shopForm.value = { name: '', address: '', description: '' }
  showShopForm.value = true
}

function openEditShop(shop: any) {
  editShop.value = shop
  shopForm.value = { name: shop.name, address: shop.address, description: shop.description }
  showShopForm.value = true
}

async function handleShopSubmit() {
  if (!shopForm.value.name) return
  if (editShop.value) {
    await shopStore.updateShop(editShop.value._id, shopForm.value)
  } else {
    await shopStore.createShop(shopForm.value)
  }
  showShopForm.value = false
}

async function handleShopDelete(id: string) {
  if (confirm('ยืนยันลบร้านค้า?')) {
    await shopStore.removeShop(id)
    if (selectedShop.value?._id === id) selectedShop.value = null
  }
}

async function selectShop(shop: any) {
  selectedShop.value = shop
  const res = await axios.get(`http://localhost:3000/api/products/shop/${shop._id}`)
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
    await axios.patch(
      `http://localhost:3000/api/products/${editProduct.value._id}`,
      productForm.value
    )
  } else {
    await axios.post('http://localhost:3000/api/products', {
      ...productForm.value,
      shopId: selectedShop.value._id,
    })
  }
  showProductForm.value = false
  selectShop(selectedShop.value)
}

async function handleProductDelete(id: string) {
  if (confirm('ยืนยันลบสินค้า?')) {
    await axios.delete(`http://localhost:3000/api/products/${id}`)
    selectShop(selectedShop.value)
  }
}
</script>

<template>
  <div class="page">

    <div class="section-header">
      <h1>จัดการร้านค้า</h1>
      <button class="btn-add" @click="openCreateShop">+ เพิ่มร้านค้า</button>
    </div>

    <!-- SEARCH -->
    <div class="search-box">
      <input v-model="search" placeholder=" ค้นหาร้านค้า..." class="search-input" />
      <button v-if="search" class="btn-clear" @click="search = ''; shopStore.fetchAll()">✕</button>
    </div>

    <!-- SHOP FORM -->
    <div v-if="showShopForm" class="form-box">
      <h3>{{ editShop ? 'แก้ไขร้านค้า' : 'เพิ่มร้านค้าใหม่' }}</h3>
      <div class="form-group">
        <label>ชื่อร้าน</label>
        <input v-model="shopForm.name" placeholder="ชื่อร้านค้า" required />
      </div>
      <div class="form-group">
        <label>ที่อยู่</label>
        <input v-model="shopForm.address" placeholder="ที่อยู่ร้านค้า" />
      </div>
      <div class="form-group">
        <label>รายละเอียด</label>
        <input v-model="shopForm.description" placeholder="รายละเอียด" />
      </div>
      <div class="form-actions">
        <button class="btn-save" @click="handleShopSubmit">
          {{ editShop ? 'บันทึก' : 'เพิ่ม' }}
        </button>
        <button class="btn-cancel" @click="showShopForm = false">ยกเลิก</button>
      </div>
    </div>

    <!-- LOADING / EMPTY -->
    <p v-if="shopStore.loading" class="txt-gray">กำลังโหลด...</p>
    <p v-if="!shopStore.loading && shopStore.shops.length === 0 && !search" class="txt-gray">
      ยังไม่มีร้านค้า
    </p>
    <p v-if="!shopStore.loading && shopStore.shops.length === 0 && search" class="txt-gray">
      ไม่พบร้านค้าที่ค้นหา "{{ search }}"
    </p>

    <!-- SHOP TABLE -->
    <table v-if="shopStore.shops.length > 0" class="data-table">
      <thead>
        <tr>
          <th>ชื่อร้านค้า</th>
          <th>รายละเอียด</th>
          <th>จัดการ</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="shop in shopStore.shops" :key="shop._id" :class="{ 'row-active': selectedShop?._id === shop._id }">
          <td>{{ shop.name }}</td>
          <td>{{ shop.description || '-' }}</td>
          <td>
            <button class="btn-view" @click="selectShop(shop)">สินค้า</button>
            <button class="btn-edit" @click="openEditShop(shop)">แก้ไข</button>
            <button class="btn-del" @click="handleShopDelete(shop._id)">ลบ</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="search && shopStore.shops.length > 0" class="txt-gray">
      พบ {{ shopStore.shops.length }} ร้าน
    </p>

    <!-- PRODUCT SECTION -->
    <div v-if="selectedShop" class="product-section">
      <div class="section-header">
        <h2>สินค้าในร้าน: <span class="shop-name">{{ selectedShop.name }}</span></h2>
        <div>
          <button class="btn-add" @click="openCreateProduct">+ เพิ่มสินค้า</button>
          <button class="btn-cancel" @click="selectedShop = null">ปิด</button>
        </div>
      </div>

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

      <p v-if="products.length === 0 && !showProductForm" class="txt-gray">
        ยังไม่มีสินค้าในร้านนี้
      </p>

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
    </div>

  </div>
</template>